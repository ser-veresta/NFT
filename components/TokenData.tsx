import Image from "next/image";
import React, { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import useSWR from "swr";
import { contractState } from "../redux/Contract";
import ABI from "../utils/abi.json";
import GAME_ABI from "../utils/game_abi.json"
import { fetcher, fetchTokenURI } from "../utils/fetcher";

interface props {
  token: number;
  library: any;
  pets?: Boolean
}

const gameContractAddress = "0xad142f3F2FC64fDC66E825879Dc5A263E66D7E0F"

const TokenData: React.FC<props> = ({ token, library, pets }) => {
  const { contractAddress } = useSelector((state: any): contractState => state.contractReducer);

  const { data, error } = useSWR(!pets ? [contractAddress, "nftHoldings", token] : null, { fetcher: fetcher(library, ABI.abi) });

  const { data: petData, error: petError } = useSWR(pets ? [gameContractAddress, "gameNftStatus", token] : null, { fetcher: fetcher(library, GAME_ABI.abi) })

  const { data: tokenData, error: err } = useSWR(data ? data[3] : petData ? petData[2] : null, { fetcher: fetchTokenURI });

  const notify = useCallback((type: "error" | "success", message: string) => {
    toast(message, { type });
  }, []);

  useEffect(() => {
    console.log(petData, petError, token)
  }, [])

  useEffect(() => {
    if (error && error.reason) {
      console.log({ error });
      notify("error", error.reason);
    }
  }, [error, notify]);

  return useMemo(() => {
    if (!tokenData) return <p>Loading ...</p>;
    return (
      <>
        <div className="flex flex-col p-4 gap-2 rounded-md">
          <div className="capitalize">
            <strong>{tokenData.name}</strong>
          </div>
          <Image
            src={"https://ipfs.io/ipfs/" + tokenData.image.split("/").slice(2).join("/")}
            alt={tokenData.name}
            width={200}
            height={200}
            placeholder="blur"
            blurDataURL="/loading.png"
          />
        </div>
      </>
    );
  }, [tokenData]);
};

export default TokenData;
