import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, WeekDeliveryPredictionTableData } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight } from "react-native";
import { styles } from "./styles.tsx";
import { Text, Thumbnail } from "native-base";
import { WeekDeliveryPrediction, ItemGroup, ItemGroupCategory } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { PREDICTIONS_ICON } from "../../../static/images";
import Icon from "react-native-vector-icons/Feather";
import * as _ from "lodash";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  itemGroupCategory?: ItemGroupCategory;
};

/**
 * Component state
 */
interface State {
  loading: boolean;

  itemGroups: ItemGroup[];
  weekDeliveryPredictions: WeekDeliveryPrediction[];
  weekDeliveryPredictionTableData: WeekDeliveryPredictionTableData[];
};

/**
 * Week delivery prediction component class
 */
class WeekDeliveryPredictionScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      weekDeliveryPredictions: [],
      weekDeliveryPredictionTableData: [],
      itemGroups: []
    };
  }

  static navigationOptions = ({ navigation }: any) => {
    return {
      headerTitle: <TopBar navigation={navigation}
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
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ loading: true });

    await this.loadItemGroups();
    await this.loadWeekDeliveryPredictionTableData();
  }

  /**
   * On list item click
   * 
   * @param screen screen
   * @param predictionTableData predictionTableData
   */
  private onListItemClick = (screen: string, predictionTableData: WeekDeliveryPredictionTableData) => {
    this.props.navigation.navigate(screen, {
      predictionData: predictionTableData
    });
  }

  /**
   * Load item groups 
   */
  private loadItemGroups = async () => {
    if (!this.props.accessToken) {
      return;
    }
    const api = new PakkasmarjaApi();
    const itemGroupService = api.getItemGroupsService(this.props.accessToken.access_token);
    const itemGroups = await itemGroupService.listItemGroups(this.props.accessToken.userId);
    const filteredItemGroups: ItemGroup[] = [];
    itemGroups.forEach((itemGroup) => {
      itemGroup.category == this.props.itemGroupCategory && filteredItemGroups.push(itemGroup);
    });
    this.setState({ itemGroups: filteredItemGroups });
  }

  /**
   * Load Week delivery prediction table data to state
   */
  private loadWeekDeliveryPredictionTableData = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const weekDeliveryPredictionService = await Api.getWeekDeliveryPredictionsService(this.props.accessToken.access_token);
    const weekDeliveryPredictions = await weekDeliveryPredictionService.listWeekDeliveryPredictions(undefined, undefined, this.props.accessToken.userId, undefined, undefined, undefined, 10);
    const weekDeliveryPredictionTableData: WeekDeliveryPredictionTableData[] = this.state.weekDeliveryPredictionTableData;
    weekDeliveryPredictions.forEach((weekDeliveryPrediction) => {
      const itemGroup = this.state.itemGroups.find(itemGroup => itemGroup.id === weekDeliveryPrediction.itemGroupId);
      weekDeliveryPredictionTableData.push({
        weekDeliveryPrediction: weekDeliveryPrediction,
        itemGroup: itemGroup ? itemGroup : {}
      });
    });
    const sortedByWeekTableData = _.sortBy(weekDeliveryPredictionTableData, [(weekDelivery) => { return weekDelivery.weekDeliveryPrediction.weekNumber; }]).reverse();
    this.setState({ weekDeliveryPredictionTableData: sortedByWeekTableData, loading: false });
  }

  /**
   * Render method
   */
  public render() {
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View >
          <View style={[styles.center, styles.topViewWithButton]}>
            <View style={[styles.center, { flexDirection: "row", marginTop: 30 }]}>
              <Thumbnail square source={PREDICTIONS_ICON} style={{ width: 38, height: 40, marginRight: 10 }} />
              <Text style={styles.viewHeaderText}>Viikkoennusteet</Text>
            </View>
            <TouchableOpacity style={[styles.deliveriesButton, { width: "60%", height: 50, marginVertical: 30 }]} onPress={() => { this.props.navigation.navigate("NewWeekDeliveryPrediction", { itemGroups: this.state.itemGroups }) }}>
              <Text style={styles.buttonText}>Uusi viikkoennuste</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "white" }}>
            {
              this.state.loading ?
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#E51D2A" />
                </View>
                :
                this.state.weekDeliveryPredictionTableData.map((predictionTableData: WeekDeliveryPredictionTableData) => {
                  return this.renderListItem(predictionTableData)
                })
            }
          </View>
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * Renders list items
   * 
   * @param predictionTableData predictionTableData
   */
  private renderListItem = (predictionTableData: WeekDeliveryPredictionTableData) => {
    const weekDeliveryPredictionId = predictionTableData.weekDeliveryPrediction.weekNumber;
    const weekNumber = `Vko ${weekDeliveryPredictionId}`;
    const itemGroupName = predictionTableData.itemGroup.displayName;
    const itemGroupCategory = predictionTableData.itemGroup.category;
    const itemGroupAmount = predictionTableData.weekDeliveryPrediction.amount;

    if (itemGroupCategory === this.props.itemGroupCategory) {
      return (
        <TouchableOpacity key={predictionTableData.weekDeliveryPrediction.id} style={styles.center} onPress={() => this.onListItemClick("ViewWeekDeliveryPrediction", predictionTableData)}>
          <View style={styles.renderCustomListItem}>
            <View style={{ flex: 2 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'black' }}>{weekNumber}</Text>
                <Text style={{ color: 'black', fontWeight: 'bold' }}>{`${itemGroupName} ${itemGroupAmount} KG`}</Text>
              </View>
            </View>
            <View style={styles.center}>
              <Text style={styles.red}>Avaa</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
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
    itemGroupCategory: state.itemGroupCategory
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

export default connect(mapStateToProps, mapDispatchToProps)(WeekDeliveryPredictionScreen);
