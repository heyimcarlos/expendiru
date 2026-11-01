import { Runtime } from "foldkit";
import { bindChartTouch } from "./chart-touch.ts";
import { Message, Model, init, update, view } from "./main";
import "./styles.css";

if (import.meta.env.DEV) {
  await import("virtual:stylex:runtime");
}

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  container: document.getElementById("root"),
  routing: {
    onUrlRequest: (request) => Message.ClickedLink({ request }),
    onUrlChange: (url) => Message.ChangedUrl({ url }),
  },
  devTools: {
    Message,
  },
});

Runtime.run(application);

bindChartTouch(document);
