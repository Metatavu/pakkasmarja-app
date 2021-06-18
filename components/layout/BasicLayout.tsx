import React, { Dispatch } from "react";
import * as actions from "../../actions"
import { connect } from "react-redux";
import { Toast, Spinner, Thumbnail, Badge, Icon, Fab } from "native-base";
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import strings from "../../localization/strings";
import { CONTRACTS_ICON, DELIVERIES_ICON, MESSAGES_ICON, NEWS_ICON, DEFAULT_FILE } from "../../static/images";
import { AccessToken, StoreState } from "../../types";
import { Unread } from "pakkasmarja-client";
import AppConfig from "../../utils/AppConfig";
import PakkasmarjaApi from "../../api";

/**
 * Component properties
 */
export interface BasicLayoutProps {
  loading?: boolean,
  displayFooter?: boolean
  errorMsg?: string,
  navigation: any,
  unreads?: Unread[],
  accessToken?: AccessToken
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
    if (this.props.errorMsg && this.props.errorMsg != prevProps.errorMsg) {
      Toast.show({
        text: this.props.errorMsg,
        type: "danger"
      });
    }
  }

  public render() {
    const unreadNews = this.countUnreads("news-");
    const unreadChats = this.countUnreads("chat");

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
        { this.props.accessToken &&
          <Fab
            active
            direction="up"
            containerStyle={{ bottom: "11%" }}
            style={{ backgroundColor: '#e01e36' }}
            position="bottomRight"
            onPress={ () => this.onHelpClick() }
          >
            <Icon name="help" />
          </Fab>
        }
        {this.props.displayFooter &&
          <View style={styles.footer}>
            <TouchableOpacity  onPress={() => this.goToScreen("News")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                { unreadNews > 0 && <Badge style={{position: "absolute", height:20}}><Text style={{color:"white"}}>{unreadNews}</Text></Badge> }
                <Thumbnail source={NEWS_ICON} square style={{ width: 22, height: 26 }} />
                <Text style={{ fontSize: 12 }}>{strings.newsFooterLink}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.goToScreen("ChatsList")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                { unreadChats > 0 && <Badge style={{position: "absolute", height:20, zIndex:99}}><Text style={{color:"white"}}>{unreadChats}</Text></Badge> }
                <Thumbnail source={MESSAGES_ICON} square style={{ width: 48, height:26 }} />
                <Text style={{ fontSize: 12 }}>{strings.messagingFooterLink}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.goToScreen("Deliveries")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail source={DELIVERIES_ICON} square style={{ width: 40, height: 26 }} />
                <Text style={{ fontSize: 12 }}>{strings.deliveriesFooterLink}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.goToScreen("Contracts")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail source={CONTRACTS_ICON} square style={{ width: 20, height: 26 }} />
                <Text style={{ fontSize: 12 }}>{strings.contractsFooterLink}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.goToScreen("Databank")}>
              <View style={{ flex: 0, alignItems: "center", alignContent: "center" }}>
                <Thumbnail source={DEFAULT_FILE} square style={{ width: 22, height: 26 }} />
                <Text style={{ fontSize: 12 }}>Tietopankki</Text>
              </View>
            </TouchableOpacity>
          </View>
        }
      </SafeAreaView>
    );
  }

  /**
   * Handles help button click
   */
  private onHelpClick = async () => {
    const appConfig = await AppConfig.getAppConfig();
    const questionGroupId = appConfig['help-question-group'];
    const { accessToken } = this.props;
    if (!questionGroupId || !accessToken) {
      return
    }

    const api = new PakkasmarjaApi();
    const questionGroupThreads = await api.getChatThreadsService(accessToken.access_token).listChatThreads(questionGroupId, "QUESTION", accessToken.userId);
    if (questionGroupThreads.length !== 1) {
      return; //Application is misconfigured, bail out.
    }

    this.props.navigation.push("ChatsList", {
      selectedQuestionThreadId: questionGroupThreads[0].id
    });
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

/**
 * Redux mapper for mapping component dispatches 
 * 
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(BasicLayout);
