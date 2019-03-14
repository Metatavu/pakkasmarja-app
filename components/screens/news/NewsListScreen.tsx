import React, { Dispatch } from "react";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import PakkasmarjaApi from "../../../api";
import Moment from 'react-moment';
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { Text, List, View } from 'native-base';
import { AccessToken, StoreState } from "../../../types";
import { ScrollView } from "react-native";
import { NewsArticle } from "pakkasmarja-client";
import { styles } from "../contracts/styles";
import { ListItem } from "react-native-elements";

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
  newsArticles: NewsArticle[]
};

/**
 * NewsList screen component
 */
class NewsListScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      newsArticles: []
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
      secondaryNavItems={[{
        "text": "UUSIMMAT",
        "link": "/secondary"
      }, {
        "text": "TAPAHTUMAT",
        "link": "/secondary"
      }, {
        "text": "UUTISET",
        "link": "/secondary"
      }]}
    />
  };

  /**
   * Component did mount
   */
  public async componentDidMount() {

    if (!this.props.accessToken) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const newsArticleService = await Api.getNewsArticlesService(this.props.accessToken.access_token);
    await newsArticleService.listNewsArticles().then((newsArticles) => {
      this.setState({ newsArticles: newsArticles })
    });
  }

  /**
   * Handles list item click
   */
  private handleClick = (newsArticle: NewsArticle) => {
    this.props.navigation.navigate('NewsArticle', {
      newsArticle: newsArticle
    });
  }

  /**
 * Component render method
 */
  public render() {
    return (
      <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <ScrollView contentContainerStyle={styles.newsContainer}>
          <View >
            <List>
              {
                this.state.newsArticles.map((newsArticle) => {
                  return (
                    <ListItem
                      key={newsArticle.id}
                      title={newsArticle.title}
                      titleStyle={{ fontSize: 22, color: "black", paddingBottom: 5, fontWeight: "bold" }}
                      subtitle={
                        <Moment style={{ marginLeft: 10, color: "gray" }} element={Text} format="DD.MM.YYYY HH:mm">
                          {newsArticle.createdAt}
                        </Moment>
                      }
                      onPress={() => { this.handleClick(newsArticle) }}
                    />
                  )
                })
              }
            </List>
          </View>
        </ScrollView>
      </BasicLayout>
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

export default connect(mapStateToProps, mapDispatchToProps)(NewsListScreen);
