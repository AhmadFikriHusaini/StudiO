import { useWindowDimensions } from "react-native";
import {
  RenderHTMLConfigProvider,
  RenderHTMLSource,
  TRenderEngineProvider,
} from "react-native-render-html";

const HtmlRenderer = ({ html }: { html: string }) => {
  const window = useWindowDimensions().width;
  return (
    <TRenderEngineProvider>
      <RenderHTMLConfigProvider>
        <RenderHTMLSource source={{ html }} contentWidth={window} />
      </RenderHTMLConfigProvider>
    </TRenderEngineProvider>
  );
};

export default HtmlRenderer;
