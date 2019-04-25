import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import Moment from 'react-moment';
import AutoResizeHeightWebView from "react-native-autoreheight-webview"
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { Text, View, Spinner } from 'native-base';
import { AccessToken, StoreState } from "../../../types";
import { NewsArticle } from "pakkasmarja-client";
import { styles } from "../contracts/styles";
import { Divider } from "react-native-elements";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import { Image, StyleSheet, TouchableHighlight } from "react-native";
import Lightbox from 'react-native-lightbox';
import Icon from "react-native-vector-icons/Feather";
import moment from "moment";
import { FileService } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';

/**
 * Component props
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken
};

/**
 * Component state
 */
interface State {
  newsArticle: NewsArticle;
  imageData?: string;
  loading: boolean;
};

const imageStyles = StyleSheet.create({
  image: {
    height: 300,
    flex: 1
  },
  imageActive: {
    flex: 1,
    resizeMode: 'contain',
  },
});

/**
 * NewsArticle screen component
 */
class NewsArticleScreen extends React.Component<Props, State> {

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
  static navigationOptions = ({ navigation }: any) => {
    return {
      headerTitle: <TopBar
        showMenu={true}
        showHeader={false}
        showUser={true}
      />,
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft:
        <TouchableHighlight onPress={() => { navigation.goBack(null) }} >
          <Icon
            name='arrow-down-left'
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
    if (!this.props.accessToken) {
      return;
    }

    this.setState({ loading: true });

    if (this.props.navigation.getParam('newsArticle')) {
      const newsArticle = this.props.navigation.getParam('newsArticle');
      this.setState({ newsArticle: newsArticle });

      if (newsArticle.imageUrl) {
        const fileService = new FileService(REACT_APP_API_URL, this.props.accessToken.access_token);
        const imageData = await fileService.getFile(newsArticle.imageUrl);
        this.setState({ imageData: imageData });
      }
    }

    this.setState({ loading: false });
  }

  /**
   * Component render method
   */
  public render() {
    if (this.state.loading) {
      return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
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
        <AutoResizeHeightWebView
          defaultHeight={400}
          AnimationDuration={0}
          scalesPageToFit={true}
          source={{
            html: `
            <html>
            <head>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="stylesheet" href="https://cdn.metatavu.io/libs/bootstrap/4.0.0/css/bootstrap.css"/>
              <style>
                h1{ 
                  font-size: 24px
                }
              </style>
            </head>
            <body>
            <div class="container">
              <h1>${title}</h1>
              <p>${date}</p>
              ${imageData ? '<img src="data:image/jpeg;base64,'+imageData+'" style="width:100%;"/>' : ''}
              ${this.state.newsArticle.contents}
            </div>
            </body>
            <script>
              function onPageLoaded() {
                window.postMessage("asd");
                if (window.postMessage.length !== 1){
                  setTimeout(onPageLoaded, 200);
                }
                else {
                  window.postMessage(window.location.href);
                }
              }
              window.onload = onPageLoaded();
            </script>
            </html>`
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
    accessToken: state.accessToken
  };
}

/**
 * Redux mapper for mapping component dispatches 
 * 
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NewsArticleScreen);
