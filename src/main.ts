import { createApp } from "vue";
import App from "./App.vue";
import "./styles.css";

/**
 * This function configures the Vue application instance.
 */
const app = createApp(App);

/**
 * This call mounts the application onto the HTML page.
 */
app.mount("#app");
