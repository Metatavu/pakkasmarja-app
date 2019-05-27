import React from "react";
import { Toast, Spinner, Thumbnail } from "native-base";
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import strings from "../../localization/strings";
import { CONTRACTS_ICON, DELIVERIES_ICON, MESSAGES_ICON, NEWS_ICON } from "../../static/images";

/**
 * Component properties
 */
export interface BasicLayoutProps {
  loading?: boolean,
  displayFooter?: boolean
  errorMsg?: string,
  navigation: any
}

/**
 * Component state
 */
interface State {

}

const styles = StyleSheet.create({
  footer: {
    height: 60,
    borderTopColor: "rgba(0,0,0,0.5)",
    borderTopWidth: 2,
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  }
});

/**
 * Basic layout component
 */
export default class BasicLayout extends React.Component<BasicLayoutProps, State> {

  constructor(props: BasicLayoutProps) {
    super(props);
    this.state = {};
  }

  public componentDidUpdate = (prevProps: BasicLayoutProps) => {
    if (this.props.errorMsg && this.props.errorMsg != prevProps.errorMsg) {
      Toast.show({
        text: this.props.errorMsg,
        type: "danger"
      });
    }
  }

  public render() {
    if (this.props.loading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner color="red" />
        </View>
      );
    }

    return (
      <SafeAreaView style={{ flex: 1 }}>
        {this.props.children}
        {this.props.displayFooter &&
          <View style={styles.footer}>
            <TouchableOpacity  onPress={() => this.goToScreen("News")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail source={NEWS_ICON} square style={{ width: 22, height: 26 }} />
                <Text>{strings.newsFooterLink}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.goToScreen("ChatsList")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail source={MESSAGES_ICON} square style={{ width: 48, height:26 }} />
                <Text>{strings.messagingFooterLink}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.goToScreen("Deliveries")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail source={DELIVERIES_ICON} square style={{ width: 40, height: 26 }} />
                <Text>{strings.deliveriesFooterLink}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.goToScreen("Contracts")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail source={CONTRACTS_ICON} square style={{ width: 20, height: 26 }} />
                <Text>{strings.contractsFooterLink}</Text>
              </View>
            </TouchableOpacity>
          </View>
        }
      </SafeAreaView>
    );
  }

  /**
   * Navigates to screen
   */
  private goToScreen = (screen: string) => {
    this.props.navigation.navigate(screen);
  }
}
