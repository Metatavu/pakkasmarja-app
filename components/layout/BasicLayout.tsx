import React from "react";
import { connect } from "react-redux";
import { Toast, Spinner, Thumbnail, Badge, Text } from "native-base";
import { StyleSheet, View, SafeAreaView, TouchableOpacity } from "react-native";
import strings from "../../localization/strings";
import { CONTRACTS_ICON, DELIVERIES_ICON, NEWS_ICON, DEFAULT_FILE } from "../../static/images";
import { AccessToken, StoreState } from "../../types";
import { Unread } from "pakkasmarja-client";

/**
 * Component properties
 */
export interface BasicLayoutProps {
  loading?: boolean;
  displayFooter?: boolean;
  errorMsg?: string;
  navigation: any;
  unreads?: Unread[];
  accessToken?: AccessToken;
  children?: React.ReactNode;
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
class BasicLayout extends React.Component<BasicLayoutProps, State> {

  constructor(props: BasicLayoutProps) {
    super(props);
    this.state = {};
  }

  public componentDidUpdate = (prevProps: BasicLayoutProps) => {
    const { errorMsg } = this.props;

    if (!!errorMsg && errorMsg !== prevProps.errorMsg) {
      Toast.show({
        text: errorMsg,
        type: "danger"
      });
    }
  }

  public render = () => {
    const { loading, children, displayFooter } = this.props;

    const unreadNews = this.countUnreads("news-");

    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner color="red" />
        </View>
      );
    }

    return (
      <SafeAreaView style={{ flex: 1 }}>
        { children }
        { displayFooter &&
          <View style={ styles.footer }>
            <TouchableOpacity onPress={ () => this.goToScreen("News") }>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                { unreadNews > 0 &&
                  <Badge style={{ position: "absolute", height:20 }}>
                    <Text style={{ color:"white" }}>
                      { unreadNews }
                    </Text>
                  </Badge>
                }
                <Thumbnail
                  source={ NEWS_ICON }
                  square
                  style={{ width: 22, height: 26 }}
                />
                <Text style={{ fontSize: 12, color: "#333" }}>
                  { strings.newsFooterLink }
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={ () => this.goToScreen("Deliveries") }>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail
                  source={ DELIVERIES_ICON }
                  square
                  style={{ width: 40, height: 26 }}
                />
                <Text style={{ fontSize: 12, color: "#333" }}>
                  { strings.deliveriesFooterLink }
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={ () => this.goToScreen("Contracts") }>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail
                  source={ CONTRACTS_ICON }
                  square
                  style={{ width: 20, height: 26 }}
                />
                <Text style={{ fontSize: 12, color: "#333" }}>
                  { strings.contractsFooterLink }
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={ () => this.goToScreen("Databank") }>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail
                  source={ DEFAULT_FILE }
                  square
                  style={{ width: 22, height: 26 }}
                />
                <Text style={{ fontSize: 12, color: "#333" }}>
                  Tietopankki
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        }
      </SafeAreaView>
    );
  }

    /**
   * Counts unreads by prefix
   *
   * @param prefix prefix
   * @return unreads
   */
  private countUnreads = (prefix: string) => {
    return (this.props.unreads || []).filter((unread: Unread) => {
      return (unread.path || "").startsWith(prefix);
    }).length;
  }

  /**
   * Navigates to screen
   */
  private goToScreen = (screen: string) => {
    this.props.navigation.navigate(screen);
  }
}

/**
 * Redux mapper for mapping store state to component props
 *
 * @param state store state
 */
function mapStateToProps(state: StoreState) {
  return {
    accessToken: state.accessToken,
    unreads: state.unreads
  };
}

export default connect(mapStateToProps)(BasicLayout);
