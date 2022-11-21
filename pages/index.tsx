import { TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import type { NextPage } from "next";
import useSWR from "swr";
import { fetcher, merkleFetcher } from "../utils/fetcher";
import { formatUnits, parseEther } from "@ethersproject/units";
import { Contract } from "@ethersproject/contracts";
import { ErrorCode } from "@ethersproject/logger";
import { hexValue } from "@ethersproject/bytes";
import ABI from "../utils/abi.json";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import TokenData from "../components/TokenData";
import { toast } from "react-toastify";
import Image from "next/image";
import Nav from "../components/Nav";
import { useDispatch, useSelector } from "react-redux";
import { changeTokenIds, contractState } from "../redux/Contract";
import Loader from "../components/Loader";

const Home: NextPage = () => {
  const { contractAddress, tokenIds } = useSelector((state: any): contractState => state.contractReducer);

  const dispatch = useDispatch();

  const { account, active, library, chainId } = useWeb3React<Web3Provider>();

  const [minting, setMinting] = useState<number>(0);

  const [isChain, setIsChain] = useState<number>(0);

  const [tokenId, setTokenID] = useState<number[]>(tokenIds);

  const { data: balance, mutate: mutateBalance } = useSWR(["getBalance", account, "latest"], {
    fetcher: fetcher(library),
  });

  const { data: tokenBalance, mutate: mutateTokenBalance } = useSWR([contractAddress, "balanceOf", account], {
    fetcher: fetcher(library, ABI.abi),
  });

  const { data } = useSWR(account ? [`/proof?leaf=${account}&confirm=yes`] : null, {
    fetcher: merkleFetcher,
  });

  const notify = useCallback((type: "error" | "success", message: string) => {
    toast(message, { type });
  }, []);

  const dismiss = useCallback(() => {
    toast.dismiss();
  }, []);


  const checkIsChain = useCallback(() => {
    setIsChain(0);

    if (chainId !== 5) {
      if (!library || !library.provider || !library.provider.request) return;

      library.provider?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexValue(5) }],
      });

      setIsChain(1);
    }

    if (chainId === 5) {
      setIsChain(1);
    }
  }, [chainId, library]);

  useEffect(() => {
    checkIsChain();
  }, [chainId, checkIsChain]);

  const getTokenID = useCallback(async () => {
    if (!isChain) return;

    const contract = new Contract(contractAddress, ABI.abi, library?.getSigner());
    let filter = contract.filters.Transfer(null, account);

    try {
      let query = await contract.queryFilter(filter, 0, "latest");
      let tokenArr: number[] = tokenId;

      for (let obj of query) {
        if (obj.args && obj.args[2]) {
          let token = parseInt(formatUnits(obj.args[2]));
          if (!tokenArr.includes(token)) tokenArr.push(token);
        }
      }

      setTokenID(tokenArr);
      dispatch(changeTokenIds(tokenArr));
    } catch (error) {
      console.log(error);
    }
  }, [library, isChain, account, contractAddress, dispatch, tokenId]);

  useEffect(() => {
    if (!library) return;
    const contract = new Contract(contractAddress, ABI.abi, library?.getSigner());

    (async () => {
      await getTokenID();
    })();

    return () => {
      //Remove the Even Listener
      contract.removeAllListeners();

      // Dismiss all toasters
      dismiss();
    };
  }, [library, contractAddress, dismiss, getTokenID]);


  // To Handle Minting NFT
  const handleMint = async () => {
    console.log("Minting ... ");
    setMinting(1);

    const contract = new Contract(contractAddress, ABI.abi, library?.getSigner());

    try {
      if (!isChain) throw { message: "Please Connect to goerli Network to Mint!!" };

      if (!data || !data.proof || !data.proof.length) {
        throw { message: "Proof not Generated for you, Plese contact Admin." };
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
      <Nav balance={balance} tokenBalance={tokenBalance} checkIsChain={checkIsChain} />
      <div className="w-11/12 m-auto">
        <div className="mt-10 flex w-full">
          <div className="w-4/6 h-body relative">
            <Image alt="" src="/NFT.png" layout="fill" objectFit="contain" />
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
          <h1 className="text-2xl font-semibold underline">Your NFT&apos;s</h1>
          <div className="flex gap-2 mt-5">
            {tokenId.length ? (
              tokenId.map((token, idx) => <TokenData key={idx} token={token} library={library} />)
            ) : (
              <div className="mt-5">
                You own <strong>Zero</strong> NFT&apos;s <strong>(or)</strong> connect to a <strong>Wallet</strong> to view
                your NFT&apos;s
              </div>
            )}
          </div>
        </div>
      </div>
      {minting ? <Loader text={"Minting, Please Wait...."} /> : null}
    </div>
  );
};

export default Home;
