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
import ProfileButton from "../../layout/ProfileButton";

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
  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerStyle: {
        height: 100,
        backgroundColor: "#E51D2A"
      },
      headerTitle: () => <TopBar/>,
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableHighlight onPress={ navigation.goBack }>
          <Icon
            name="chevron-left"
            color="#fff"
            size={ 40 }
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
      ),
      headerRight: () => <ProfileButton/>
    }
  };

  /**
   * Component did mount
   */
  public async componentDidMount() {
    const { navigation, accessToken, route } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!accessToken) {
      return;
    }

    this.setState({ loading: true });

    const newsArticle: NewsArticle = route.params.newsArticle;

    if (newsArticle) {
      this.setState({ newsArticle: newsArticle });
      this.markRead(newsArticle);

      if (newsArticle.imageUrl) {
        this.setState({
          imageData: await new FileService(REACT_APP_API_URL, accessToken.access_token).getFile(newsArticle.imageUrl)
        });
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
    const { accessToken, unreads, unreadRemoved } = this.props;

    if (!accessToken) {
      return;
    }

    const unread = unreads.find(unread => (unread.path || "") == `news-${news.id}`);

    if (!unread) {
      return;
    }

    unreadRemoved?.(unread);
    new PakkasmarjaApi().getUnreadsService(accessToken.access_token).deleteUnread(unread.id!);
  }

  /**
   * Component render method
   */
  public render = () => {
    const { accessToken, navigation } = this.props;
    const { loading, newsArticle, imageData } = this.state;

    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner color="red"/>
        </View>
      );
    }

    if (!accessToken) {
      return null;
    }

    const title = newsArticle.title;
    const date = moment(newsArticle.createdAt).format("DD.MM.YYYY HH:mm");

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
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
              ${newsArticle.contents}
            </div>
          ` }}
          scalesPageToFit={ false }
          viewportContent={ 'width=device-width, user-scalable=no' }
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
