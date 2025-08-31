import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

// dayjs 플러그인 및 로케일 설정
dayjs.extend(relativeTime);
dayjs.locale("ko");

export default dayjs;