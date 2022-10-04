import Image from "next/image";
import React, { useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import useSWR from "swr";
import ABI from "../utils/abi.json";
import { fetcher, fetchTokenURI } from "../utils/fetcher";

interface props {
  token: number;
  library: any;
}

const contractAddress = "0x9027b5f491496Fa658D534b82F61Aa7df05d1a68";

const TokenData: React.FC<props> = ({ token, library }) => {
  const { data, error } = useSWR([contractAddress, "nftHoldings", token], { fetcher: fetcher(library, ABI.abi) });

  const { data: tokenData } = useSWR(data ? data[2] : null, { fetcher: fetchTokenURI });

  const notify = useCallback((type: "error" | "success", message: string) => {
    toast(message, { type });
  }, []);

  console.log(data);

  useEffect(() => {
    console.log(data);
    if (error && error.reason) {
      notify("error", error.reason);
    }
  }, [error]);

  return useMemo(() => {
    if (!tokenData) return <p>Loading ...</p>;
    return (
      <>
        <div className="flex flex-col bg-primary-main p-4 gap-2 rounded-md">
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
  }, [token, tokenData]);
};

export default TokenData;
