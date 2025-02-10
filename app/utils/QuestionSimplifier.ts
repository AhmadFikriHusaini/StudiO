const findText = (node: any) => {
    if (!node) return "";

    if (node.type === "text") {
        return node.data.trim();
    }

    if (node.children) {
        return node.children.map(findText).join("").trim();
    }

    return "";
};

const QuestionSimplifier = (node: any) => {
    let question = "";
    let options: any[] = [];

    const traverse = (node: any) => {
        if (!node) return;

        if (node.type === "tag") {
            if (node.name === "div" && node.attribs?.class === "qtext") {
                question = findText(node).trim();
            }
            if (node.name === "div" && node.attribs?.class?.startsWith("r")) {
                const answerNode = node.children.find(
                    (child: any) =>
                        child.name === "div" &&
                        child.attribs?.["data-region"] === "answer-label"
                );
                if (answerNode) {
                    const optionText = findText(answerNode);
                    if (optionText) {
                        options.push(optionText);
                    }
                }
            }
        }
        if (node.children) {
            node.children.forEach(traverse);
        }
    };

    traverse(node);
    return { question, options };
};

export default QuestionSimplifier;
