import "../styles/globals.css";
import type { AppProps } from "next/app";

import { Web3ReactProvider } from "@web3-react/core";
import { getLibrary } from "../utils/web3.config";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Component {...pageProps} />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar
        draggable={false}
        pauseOnFocusLoss={false}
        pauseOnHover
        closeButton
      />
    </Web3ReactProvider>
  );
}

export default MyApp;
