/* @refresh reload */
import { render } from "solid-js/web";
import "./design-system/tokens/index.css";
import "./index.css";
import "katex/dist/katex.min.css";
import App from "./App.tsx";

const root = document.getElementById("root");

render(() => <App />, root!);
