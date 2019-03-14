import React from "react";
import { ScrollView } from "react-native";
import BasicLayout, { BasicLayoutProps } from "./BasicLayout";

/**
 * Component properties
 */
interface Props extends BasicLayoutProps {
  backgroundColor: string
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
    return (
      <BasicLayout 
        displayFooter={this.props.displayFooter}
        errorMsg={this.props.errorMsg}
        loading={this.props.loading}
        navigation={this.props.navigation} >
        <ScrollView style={{backgroundColor: this.props.backgroundColor}}>
          {this.props.children}
        </ScrollView>
      </BasicLayout>
    );
  }
}
