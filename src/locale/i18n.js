import { addMessages, init, locale } from "svelte-i18n";
import en from "./en.json"
import ja from "./ja.json"


addMessages("en", en)
addMessages("ja", ja)

init({ initialLocale: "en" })

export const reset = () => {
    locale.set("en")
}