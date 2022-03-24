import React from "react";
import { ScrollView } from "react-native";
import BasicLayout, { BasicLayoutProps } from "./BasicLayout";

/**
 * Component properties
 */
interface Props extends BasicLayoutProps {
  backgroundColor: string;
}

/**
 * Component state
 */
interface State {}

/**
 * Component wrapping basic layout content to scroll view
 */
export default class BasicScrollLayout extends React.Component<Props, State> {

  public render() {
    const {
      displayFooter,
      errorMsg,
      loading,
      navigation,
      backgroundColor,
      children
    } = this.props;
    return (
      <BasicLayout 
        displayFooter={ displayFooter }
        errorMsg={ errorMsg }
        loading={ loading }
        navigation={ navigation }>
        <ScrollView
          style={
            {
              backgroundColor: backgroundColor,
              flex: 1
            }
          }
        >
          { children }
        </ScrollView>
      </BasicLayout>
    );
  }
}
