import {MetaCar} from "./metacar";
import {embeddedUrl, embeddedUrlI} from "./embedded";
import {MetaCarEditor} from "./metacar_editor";

const metacar = {
    env: MetaCar,
    editor: MetaCarEditor,
    level: embeddedUrl
}

export default metacar;