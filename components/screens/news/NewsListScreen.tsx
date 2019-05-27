import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import PakkasmarjaApi from "../../../api";
import Moment from 'react-moment';
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { Text, List, View, Spinner } from 'native-base';
import { AccessToken, StoreState } from "../../../types";
import { NewsArticle } from "pakkasmarja-client";
import { ListItem } from "react-native-elements";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import * as _ from "lodash"
import { TouchableOpacity } from "react-native";

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
  newsArticles: NewsArticle[],
  loading: boolean
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
      newsArticles: [],
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
        frontPage={true}
      />,
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft: null
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
    const Api = new PakkasmarjaApi();
    const newsArticleService = await Api.getNewsArticlesService(this.props.accessToken.access_token);
    const newsArticles = await newsArticleService.listNewsArticles();
    const sortedNewsArticles = _.sortBy(newsArticles, [(newsArticle) => { return newsArticle.updatedAt; }]).reverse();
    this.setState({ newsArticles: sortedNewsArticles, loading: false });
  }

  /**
   * Handles list item click
   */
  private handleListItemClick = (newsArticle: NewsArticle) => {
    this.props.navigation.navigate('NewsArticle', {
      newsArticle: newsArticle
    });
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
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View >
          <List>
            {
              this.state.newsArticles.map((newsArticle) => {
                return (
                  <TouchableOpacity onPress={() => { this.handleListItemClick(newsArticle) }}>
                    <ListItem
                      key={newsArticle.id}
                      title={newsArticle.title}
                      titleStyle={{ fontSize: 22, color: "black", paddingBottom: 5, fontWeight: "bold" }}
                      subtitle={
                        <Moment style={{ marginLeft: 10, color: "gray" }} element={Text} format="DD.MM.YYYY HH:mm">
                          {newsArticle.createdAt ? newsArticle.createdAt.toString() : undefined}
                        </Moment>
                      }
                    />
                  </TouchableOpacity>
                )
              })
            }
          </List>
        </View>
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

export default connect(mapStateToProps, mapDispatchToProps)(NewsListScreen);
