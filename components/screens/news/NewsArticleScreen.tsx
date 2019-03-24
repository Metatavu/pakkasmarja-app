import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import Moment from 'react-moment';
import AutoResizeHeightWebView from "react-native-autoreheight-webview"
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { Text, View } from 'native-base';
import { AccessToken, StoreState } from "../../../types";
import { NewsArticle } from "pakkasmarja-client";
import { styles } from "../contracts/styles";
import { Divider } from "react-native-elements";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import { Image, StyleSheet } from "react-native";
import Lightbox from 'react-native-lightbox';

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
  newsArticle: NewsArticle
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
      }
    };
  }

  /**
   * Navigation options
   */
  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * Component did mount
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    if (this.props.navigation.getParam('newsArticle')) {
      this.setState({ newsArticle: this.props.navigation.getParam('newsArticle') });
    }

  }

  /**
   * Component render method
   */
  public render() {
    const { accessToken } = this.props;
    if (!accessToken) {
      return null;
    }

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={{ padding: 15 }}>
          <Text style={[{ fontSize: 24 }, styles.TextBold]}>{this.state.newsArticle.title}</Text>
          <Moment
            style={{ fontSize: 16, marginBottom: 15, color: "gray" }}
            format="DD.MM.YYYY HH:mm" element={Text}
            date={this.state.newsArticle.createdAt}
          />
          <Divider />
          {this.state.newsArticle.imageUrl &&
            <Lightbox
              activeProps={{
                style: imageStyles.imageActive,
              }}
            >
              <Image style={imageStyles.image} source={{uri: this.state.newsArticle.imageUrl, headers: {"Authorization": `Bearer ${accessToken.access_token}`}}} />
            </Lightbox>
          }
        </View>
        <AutoResizeHeightWebView
          defaultHeight={400}
          AnimationDuration={0}
          source={{
            html: `
            <html>
            <head>
              <style>
                h1{font-size:24px;}
                p{font-size:20px;}
              </style>
            </head>
            <body>${this.state.newsArticle.contents}</body>
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
