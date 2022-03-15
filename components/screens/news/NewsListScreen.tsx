import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import PakkasmarjaApi from "../../../api";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { Text, List, View, Spinner, ListItem, Body } from 'native-base';
import { AccessToken, StoreState } from "../../../types";
import { NewsArticle, Unread } from "pakkasmarja-client";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import _ from "lodash"
import moment from "moment";
import { StackNavigationOptions } from '@react-navigation/stack';

/**
 * Component props
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken,
  unreads?: Unread[],
  unreadsUpdate: (unreads: Unread[]) => void
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
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerTitle: () => (
        <TopBar
          navigation={ navigation }
          showMenu={ true }
          showHeader={ false }
          showUser={ true }
          frontPage={ true }
        />
      ),
      headerTitleContainerStyle: {
        left: 0
      },
      headerLeft: () => null
    }
  };

  /**
   * Component did mount
   */
  public async componentDidMount() {
    (this.props.navigation).setOptions(this.navigationOptions(this.props.navigation));
    if (!this.props.accessToken) {
      return;
    }
    this.props.navigation.addListener('willFocus', () => {
      this.loadData();
    });
    this.loadData();

  }

  /**
   * Load data
   */
  private loadData = async () => {
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ loading: true });
    const Api = new PakkasmarjaApi();
    const newsArticleService = Api.getNewsArticlesService(this.props.accessToken.access_token);
    const newsArticles = await newsArticleService.listNewsArticles();
    const sortedNewsArticles = newsArticles.sort((a, b) => {
      return this.getTime(b.createdAt) - this.getTime(a.createdAt)
    });
    await this.checkUnreads();
    this.setState({ newsArticles: sortedNewsArticles, loading: false });
  }

  /**
   * Get time
   *
   * @param date date
   */
  private getTime(date?: Date) {
    return date ? new Date(date).getTime() : 0;
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
              this.state.newsArticles.map(newsArticle =>
                <ListItem
                  key={ newsArticle.id }
                  button
                  onPress={ () => this.handleListItemClick(newsArticle) }
                >
                  <Body>
                    <Text
                      style={{
                        fontSize: 22,
                        color: "black",
                        paddingBottom: 5,
                        fontWeight: newsArticle.id && this.isUnread(newsArticle.id.toString()) ? "bold" : "normal"
                      }}
                    >
                      { newsArticle.title }
                    </Text>
                    <Text note>
                      { newsArticle.id && this.isUnread(newsArticle.id.toString()) ?
                        <View style={{ flex: 1, flexDirection: "row", marginLeft: 10 }}>
                          <Text style={{ color: "red" }}>(Uusi)</Text>
                          <Text style={{ marginLeft: 10, color: "gray" }}>
                            { newsArticle.createdAt && moment(newsArticle.createdAt).format("DD.MM.YYYY HH:mm") }
                          </Text>
                        </View>
                        :
                        <Text style={{ marginLeft: 10, color: "gray" }}>
                          { newsArticle.createdAt && moment(newsArticle.createdAt).format("DD.MM.YYYY HH:mm") }
                        </Text>
                      }
                    </Text>
                  </Body>
                </ListItem>
              )
            }
          </List>
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * Checks for unreads
   */
  private checkUnreads = async () => {
    const { accessToken, unreadsUpdate } = this.props;

    if (!accessToken) {
      return;
    }

    const unreads = await new PakkasmarjaApi()
      .getUnreadsService(accessToken.access_token)
      .listUnreads();

    unreadsUpdate(unreads);
  }

  /**
   * Retuns whether news item is unread
   *
   * @return whether news item is unread
   */
  private isUnread = (newsId: string) => {
    const { unreads } = this.props;

    if (!unreads) {
      return;
    }

    return !!unreads.find(unread => unread.path?.startsWith(`news-${newsId}`));
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
    unreadsUpdate: (unreads: Unread[]) => dispatch(actions.unreadsUpdate(unreads))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NewsListScreen);
