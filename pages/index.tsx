import { TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import type { NextPage } from "next";
import useSWR from "swr";
import { fetcher, merkleFetcher } from "../utils/fetcher";
import { parseEther } from "@ethersproject/units";
import { Contract } from "@ethersproject/contracts";
import { ErrorCode } from "@ethersproject/logger";
import ABI from "../utils/abi.json";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import TokenData from "../components/TokenData";
import { toast } from "react-toastify";
import Image from "next/image";
import Nav from "../components/Nav";
import { useSelector } from "react-redux";
import { contractState } from "../redux/Contract";

const Home: NextPage = () => {
  const { contractAddress, id } = useSelector((state: any): contractState => state.contractReducer);

  console.log(id);

  const { account, active, library } = useWeb3React<Web3Provider>();

  const [minting, setMinting] = useState<number>(0);

  const [tokenId, setTokenID] = useState<number[]>([]);

  const { data: balance, mutate: mutateBalance } = useSWR(["getBalance", account, "latest"], {
    fetcher: fetcher(library),
  });

  const { data: tokenBalance, mutate: mutateTokenBalance } = useSWR([contractAddress, "balanceOf", account], {
    fetcher: fetcher(library, ABI.abi),
  });

  const { data } = useSWR([`/proof?id=${id}&leaf=${account}`], {
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
    contract.on(filter, async (...args) => {
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

  // To Handle Minting NFT
  const handleMint = async () => {
    console.log("Minting ... ");
    setMinting(1);

    const contract = new Contract(contractAddress, ABI.abi, library?.getSigner());

    try {
      if (!data || !data.proof || !data.proof.length) {
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
      <Nav balance={balance} tokenBalance={tokenBalance} />
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
