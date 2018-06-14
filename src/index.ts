import {MetaCar} from "./metacar";
import {embeddedUrl, embeddedUrlI} from "./embedded";
import {MetaCarEditor} from "./metacar_editor";
import {BasicMotionEngine} from "./basic_motion_engine";
import {ControlMotionEngine} from "./control_motion_engine";

const metacar = {
    env: MetaCar,
    editor: MetaCarEditor,
    level: embeddedUrl,
    motion: {
        BasicMotion: BasicMotionEngine,
        ControlMotion: ControlMotionEngine
    }
}

export default metacar;