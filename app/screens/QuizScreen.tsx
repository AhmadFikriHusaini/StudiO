import SafeView from "../components/SafeView";
import QuestionsView from "../components/QuestionsView";

const QuizScreen = ({ route }: any) => {
  const { attemptid, timestart, timelimit, page, length } = route.params;
  return (
    <SafeView className="flex-1">
      <QuestionsView
        attemptid={attemptid}
        timestart={timestart}
        timelimit={timelimit}
        page={page}
        length={length}
      />
    </SafeView>
  );
};

export default QuizScreen;
