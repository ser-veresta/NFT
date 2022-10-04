import { TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import type { NextPage } from "next";
import useSWR from "swr";
import { fetcher, merkleFetcher } from "../utils/fetcher";
import { formatEther, parseEther } from "@ethersproject/units";
import { Contract } from "@ethersproject/contracts";
import { injectedConnector } from "../utils/web3.config";
import { ErrorCode } from "@ethersproject/logger";
import ABI from "../utils/abi.json";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import TokenData from "../components/TokenData";
import { toast } from "react-toastify";
import Image from "next/image";

const contractAddress = "0x9027b5f491496Fa658D534b82F61Aa7df05d1a68";

const Home: NextPage = () => {
  const { account, activate, active, library } = useWeb3React<Web3Provider>();

  const [minting, setMinting] = useState<number>(0);

  const [tokenId, setTokenID] = useState<number[]>([]);

  const { data: balance, mutate: mutateBalance } = useSWR(["getBalance", account, "latest"], {
    fetcher: fetcher(library),
  });

  const { data: tokenBalance, mutate: mutateTokenBalance } = useSWR([contractAddress, "balanceOf", account], {
    fetcher: fetcher(library, ABI.abi),
  });

  const { data } = useSWR([`/proof?id=72db4df8-ecf1-4398-9b26-a5dc69b5cf73&leaf=${account}`], {
    fetcher: merkleFetcher,
  });

  const notify = useCallback((type: "error" | "success", message: string) => {
    toast(message, { type });
  }, []);

  const dismiss = useCallback(() => {
    toast.dismiss();
  }, []);

  useEffect(() => {
    if (!library) return;
    const contract = new Contract(contractAddress, ABI.abi, library?.getSigner());

    // Creating a contract filter
    let filter = contract.filters.Transfer(null, account);

    // Event Listener to filter all the tokens for the connect address
    contract.on("Transfer", async (...args) => {
      const [f, t, token] = args;
      setTokenID((val) => [...val, token.toNumber()]);

      mutateBalance(undefined, true);
      mutateTokenBalance(undefined, true);
    });

    return () => {
      //Remove the Even Listener
      contract.removeAllListeners(filter);

      // Dismiss all toasters
      dismiss();
    };
  }, [library]);

  // To Handle Wallet Connection
  const connectWallet = async () => {
    activate(injectedConnector);
  };

  // To Handle Minting NFT
  const handleMint = async () => {
    console.log("Minting ... ");
    setMinting(1);

    const contract = new Contract(contractAddress, ABI.abi, library?.getSigner());

    try {
      if (!data.proof || !data.proof.length) {
        setMinting(0);
        return notify("error", "Proof not Generated for you, Plese contact Admin.");
      }

      let test = await contract.callStatic.whitelistMint(data.proof, account, { value: parseEther("0.001") });
      console.log(test);
      const txn: TransactionResponse = await contract.whitelistMint(data.proof, account, {
        value: parseEther("0.001"),
      });

      let receipt = await txn.wait();
      console.log(txn, receipt);

      mutateBalance(undefined, true);
      mutateTokenBalance(undefined, true);

      notify("success", "Mint Successfull,It May Take Couple of Minutes for the transaction to reflect");
      setMinting(0);
    } catch (err) {
      const error: any = err;
      setMinting(0);

      if (error.code && error.code in ErrorCode) {
        return notify("error", error.error ? error.error.message : error.reason);
      } else {
        return notify("error", error.message || "Internal Error");
      }
    }
  };

  return (
    <div className="font-Quicksand">
      <Head>
        <title>NFT</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="bg-primary-main h-nav shadow-sm">
        <div className="w-11/12 flex justify-around items-center h-full m-auto">
          <h1 className="text-3xl font-bold">NFT</h1>
          <div className="flex-grow"></div>
          {active && balance && tokenBalance ? (
            <div className="font-semibold flex gap-2">
              <div>
                <span className="text-lg font-bold">Acc: </span>
                {account?.slice(0, 6)}........{account?.slice(account.length - 2)} |
              </div>
              <div>
                <span className="text-lg font-bold">Balance: </span>
                {parseFloat(formatEther(balance)) + " ETH"} |
              </div>
              <div>
                <span className="text-lg font-bold">Owned: </span>
                {parseFloat(tokenBalance.toNumber()).toPrecision(2)}
              </div>
            </div>
          ) : (
            <button
              className="bg-primary-lighter p-2 px-4 rounded-3xl hover:bg-primary-light shadow-md active:shadow-sm font-bold"
              onClick={connectWallet}
            >
              Connect
            </button>
          )}
        </div>
      </div>
      <div className="w-11/12 m-auto">
        <div className="mt-10 flex w-full">
          <div className="w-4/6 h-body relative">
            <Image src="/NFT.png" layout="fill" objectFit="contain" />
          </div>
          <div className="px-2 flex flex-col justify-center items-start gap-10 h-body">
            <h2 className="text-2xl">
              Get your NFT <strong>NOW</strong> in a click of a button
            </h2>
            <div>
              <button
                disabled={!active || minting === 1}
                onClick={handleMint}
                className="p-3 bg-primary-light hover:bg-primary-main shadow-md active:shadow rounded-md px-14 disabled:cursor-not-allowed disabled:bg-primary-dark"
              >
                Get NFT
              </button>
            </div>
          </div>
        </div>

        <div className="my-10">
          <h1 className="text-2xl font-semibold underline">Your NFT's</h1>
          <div className="flex gap-2 mt-5">
            {tokenId.length ? (
              tokenId.map((token, idx) => <TokenData key={idx} token={token} library={library} />)
            ) : (
              <div className="mt-5">
                You own <strong>Zero</strong> NFT's <strong>(or)</strong> connect to a <strong>Wallet</strong> to view
                your NFT's
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
