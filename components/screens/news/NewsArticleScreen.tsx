import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { View, Spinner } from 'native-base';
import { AccessToken, StoreState } from "../../../types";
import { NewsArticle, Unread } from "pakkasmarja-client";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import { TouchableHighlight, Dimensions, Linking } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import moment from "moment";
import { FileService } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import AutoHeightWebView from 'react-native-autoheight-webview'
import PakkasmarjaApi from "../../../api";
import WebView from "react-native-webview";
import { StackNavigationOptions } from '@react-navigation/stack';

/**
 * Component props
 */
interface Props {
  navigation: any,
  route: any,
  accessToken?: AccessToken,
  unreads: Unread[],
  unreadRemoved?: (unread: Unread) => void;
};

/**
 * Component state
 */
interface State {
  newsArticle: NewsArticle;
  imageData?: string;
  loading: boolean;
};

/**
 * NewsArticle screen component
 */
class NewsArticleScreen extends React.Component<Props, State> {

  /**
   * Web view component reference
   */
  private webView = React.createRef<AutoHeightWebView>();

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      newsArticle: {
        title: "",
        contents: ""
      },
      loading: false
    };
  }

  /**
   * Navigation options
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerTitle: () => <TopBar navigation={navigation}
        showMenu={true}
        showHeader={false}
        showUser={true}
      />,
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft: () =>
        <TouchableHighlight onPress={() => { navigation.goBack() }} >
          <Icon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
    }
  };

  /**
   * Component did mount
   */
  public async componentDidMount() {
    this.props.navigation.setOptions(this.navigationOptions(this.props.navigation));
    if (!this.props.accessToken) {
      return;
    }

    this.setState({ loading: true });

    const newsArticle = this.props.route.params.newsArticle;

    if (newsArticle) {
      this.setState({ newsArticle: newsArticle });
      this.markRead(newsArticle);

      if (newsArticle.imageUrl) {
        const fileService = new FileService(REACT_APP_API_URL, this.props.accessToken.access_token);
        const imageData = await fileService.getFile(newsArticle.imageUrl);
        this.setState({ imageData: imageData });
      }
    }

    this.setState({ loading: false });
  }

  /**
   * Retuns related unread
   *
   * @return related unread
   */
  private markRead = (news: any) => {
    if (!this.props.accessToken) {
      return;
    }

    const unread = this.props.unreads.find((unread: Unread) => {
      return (unread.path || "") == `news-${news.id}`;
    });

    if (!unread) {
      return;
    }

    this.props.unreadRemoved && this.props.unreadRemoved(unread);
    new PakkasmarjaApi().getUnreadsService(this.props.accessToken.access_token).deleteUnread(unread.id!);
  }

  /**
   * Component render method
   */
  public render() {
    if (this.state.loading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner color="red" />
        </View>
      );
    }
    const { accessToken } = this.props;
    if (!accessToken) {
      return null;
    }

    const title = this.state.newsArticle.title;
    const date = moment(this.state.newsArticle.createdAt).format("DD.MM.YYYY HH:mm");
    const imageData = this.state.imageData;

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <AutoHeightWebView
          ref={ this.webView }
          style={{ width: Dimensions.get('window').width - 20, marginLeft: 10, marginRight: 10, marginTop: 20 }}
          scrollEnabled={false}
          customStyle={`
            h1{
              font-size: 24px
            }
          `}
          files={[{
            href: 'https://cdn.metatavu.io/libs/bootstrap/4.0.0/css/bootstrap.css',
            type: 'text/css',
            rel: 'stylesheet'
          }]}
          source={{ html: `
            <div class="container">
              <h1>${title}</h1>
              <p>${date}</p>
              ${imageData ? '<img src="data:image/jpeg;base64,' + imageData + '" style="width:100%;"/>' : ''}
              ${this.state.newsArticle.contents}
            </div>
          ` }}
          scalesPageToFit={false}
          viewportContent={'width=device-width, user-scalable=no'}
          onNavigationStateChange={ event => {
            if (event.url !== "about:blank") {
              Linking.openURL(event.url);
              (this.webView.current as WebView).goBack();
            }
          }}
        />
      </BasicScrollLayout>
    );
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
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken)),
    unreadRemoved: (unread: Unread) => dispatch(actions.unreadRemoved(unread))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NewsArticleScreen);
