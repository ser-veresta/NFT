import { isAddress } from "@ethersproject/address";
import { Contract } from "@ethersproject/contracts";

export const fetcher =
  (library: any, abi?: any) =>
  (...args: any[]) => {
    const [arg1, arg2, ...params] = args;
    // console.log([...args]);

    if (isAddress(arg1)) {
      const contract = new Contract(arg1, abi, library.getSigner());

      return contract[arg2](...params);
    }

    return library[arg1](arg2, ...params);
  };

export const fetchTokenURI = (url: string) => {
  let URI = "https://ipfs.io/ipfs/" + url.split("/").slice(2).join("/");
  //   console.log(URI);
  return fetch(URI).then((r) => r.json());
};
