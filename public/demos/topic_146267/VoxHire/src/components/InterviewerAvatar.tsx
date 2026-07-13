interface Props {
  status: "ready" | "listening" | "thinking" | "speaking" | "error";
}

const stateCopy = {
  ready: "准备开始下一轮交流",
  listening: "正在认真聆听",
  thinking: "正在整理回答",
  speaking: "正在提问",
  error: "连接需要检查",
};

export function InterviewerAvatar({ status }: Props) {
  return (
    <div className={`interviewer-photo ${status}`}>
      <img src="/interviewer.jpg" alt="面试官林知远" />
      <span>{stateCopy[status]}</span>
    </div>
  );
}
