import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { NextPage } from "next";
import useSWR from "swr";
import Nav from "../../components/Nav";
import { fetcher, merkleFetcher } from "../../utils/fetcher";
import ABI from "../../utils/abi.json";
import { useDispatch, useSelector } from "react-redux";
import { changeId, contractState } from "../../redux/Contract";
import { FormEvent, useState } from "react";
import axios from "axios";

const whitelistPage: NextPage = () => {
  const { contractAddress, id } = useSelector((state: any): contractState => state.contractReducer);
  const dispatch = useDispatch();

  const [rootUpdating, setRootUpdating] = useState<boolean>(false);

  const [walletAddress, setWalletAddress] = useState<string>("");

  const { library, account } = useWeb3React<Web3Provider>();

  const { data: balance } = useSWR(["getBalance", account, "latest"], {
    fetcher: fetcher(library),
  });

  const { data: tokenBalance } = useSWR([contractAddress, "balanceOf", account], {
    fetcher: fetcher(library, ABI.abi),
  });

  const { data } = useSWR([`/users?id=${id}`], {
    fetcher: merkleFetcher,
  });

  const onSubmit = async () => {
    setRootUpdating(true);
    console.log("updating....");
    let idRes;
    try {
      if (id) {
        let { data } = await axios.patch("http://localhost:9000/merkle/root", { data: walletAddress.split(","), id });
      } else {
        let { data } = await axios.post("http://localhost:9000/merkle/root", { data: walletAddress.split(",") });
        dispatch(changeId(data.id));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setRootUpdating(false);
    }
  };

  console.log(data);

  return (
    <div className="font-Quicksand">
      <Nav balance={balance} tokenBalance={tokenBalance} />
      <div className="w-11/12 m-auto">
        <div className="mt-10 flex w-full">
          <div className="flex flex-col gap-2">
            <input
              className="w-52 border-2 px-2 p-1 border-primary-main rounded-md bg-gray-200"
              name="walletAddress"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
            <button
              className="px-2 py-2 rounded-full bg-primary-light hover:bg-primary-main active:shadow-none shadow disabled:cursor-not-allowed disabled:active:shadow disabled:bg-primary-dark disabled:hover:bg-primary-dark"
              disabled={rootUpdating}
              onClick={onSubmit}
            >
              {!id ? "Set Root" : "Update Root"}
            </button>
          </div>
          <div className="border w-36">
            <ol>
              {data?.leafs?.map((item: string) => (
                <li>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default whitelistPage;
