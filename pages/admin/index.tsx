import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { NextPage } from "next";
import useSWR from "swr";
import Nav from "../../components/Nav";
import { fetcher, merkleFetcher } from "../../utils/fetcher";
import ABI from "../../utils/abi.json";
import { useDispatch, useSelector } from "react-redux";
import { changeId, contractState } from "../../redux/Contract";
import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { hexValue } from "@ethersproject/bytes";
import Loader from "../../components/Loader";

const WhitelistPage: NextPage = () => {
  const { contractAddress, id } = useSelector((state: any): contractState => state.contractReducer);
  const dispatch = useDispatch();

  const [rootUpdating, setRootUpdating] = useState<boolean>(false);

  const [walletAddress, setWalletAddress] = useState<string>("");

  const [isChain, setIsChain] = useState<number>(0);

  const { library, account, chainId } = useWeb3React<Web3Provider>();

  const { data: balance } = useSWR(["getBalance", account, "latest"], {
    fetcher: fetcher(library),
  });

  const { data: tokenBalance } = useSWR([contractAddress, "balanceOf", account], {
    fetcher: fetcher(library, ABI.abi),
  });

  const { data: currID } = useSWR([`/current`], {
    fetcher: merkleFetcher,
  });

  const { data, mutate } = useSWR([`/users`], {
    fetcher: merkleFetcher,
  });


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

  const onSubmit = async () => {
    setRootUpdating(true);
    console.log("updating....");
    try {
      if (currID?.id) {
        await axios.patch(`${process.env.NEXT_PUBLIC_HOSTNAME}/merkle/root`, { data: walletAddress.split(",") });
      } else {
        let { data } = await axios.post(`${process.env.NEXT_PUBLIC_HOSTNAME}/merkle/root`, { data: walletAddress.split(",") });
        dispatch(changeId(data.id));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setRootUpdating(false);
      setWalletAddress("");
      mutate(undefined, true);
    }
  };

  return (
    <div className="font-Quicksand">
      <Nav balance={balance} tokenBalance={tokenBalance} checkIsChain={checkIsChain} />
      <div className="w-11/12 m-auto">
        <div className="mt-10 flex gap-2 w-full min-h-full">
          <div className="w-full flex flex-col gap-4 items-start justify-start">
            <label className="text-2xl font-bold" htmlFor="walletAddress">
              Enter the address you need to add to the whitelist bellow.
            </label>
            <div className="w-full flex gap-1 items-center">
              <input
                className="w-3/4 px-4 p-2 rounded-xl outline-none hover:bg-primary-light bg-primary-lighter focus:bg-primary-light border-2 border-primary-light"
                name="walletAddress"
                id="walletAddress"
                placeholder="Enter the Wallet Address Here"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
              <button
                className="px-4 py-2 rounded-3xl rounded-tl-none rounded-br-none bg-primary-light hover:bg-primary-main active:shadow-none shadow disabled:cursor-not-allowed disabled:active:shadow disabled:bg-primary-dark disabled:hover:bg-primary-dark"
                disabled={rootUpdating}
                onClick={onSubmit}
              >
                {!currID?.id ? "Set Root" : "Update Root"}
              </button>
            </div>
            <div>
              <p><strong>Note:</strong> Multiple addresses can be added by using a comma seperated value </p>
              <p>Eg - 0x5dc5742BdC3C6cE9113410f162ef0Bc3C8d7DB08,0x81feE096e038404df2e2FfCa97B54253f2376966</p>
            </div>

          </div>
          <div className="flex-grow"></div>
          <div className="w-3/4">
            <h3 className="text-2xl font-bold">Whitlised Users:</h3>
            <div className="border p-5 px-10 bg-primary-lighter rounded-md mt-3 min-h-full">
              <ol className="list-decimal">
                {data?.leafs?.map((item: string, idx: number) => (
                  <li className="text-xl font-semibold" key={idx}>{item}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
      {rootUpdating ? <Loader text={"Updating Whitelist, Please Wait....."} /> : null}
    </div>
  );
};

export default WhitelistPage;
