import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, WeekDeliveryPredictionTableData } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { styles } from "./styles.tsx";
import { Text, Thumbnail } from "native-base";
import { WeekDeliveryPrediction, ItemGroup } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { PREDICTIONS_ICON } from "../../../static/images";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  productType?: string;
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

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    const productType: string = await this.props.navigation.getParam('type');
    this.setState({ productType: productType });

    await this.loadItemGroups();
    await this.loadWeekDeliveryPredictionTableData();
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * Renders list items
   */
  private renderListItem = (predictionTableData: WeekDeliveryPredictionTableData) => {
    const weekDeliveryPredictionId = predictionTableData.weekDeliveryPrediction.weekNumber;
    const weekNumber = `Vko ${weekDeliveryPredictionId}`;
    const itemGroupName = predictionTableData.itemGroup.displayName;
    const itemGroupCategory = predictionTableData.itemGroup.category;
    const itemGroupAmount = predictionTableData.weekDeliveryPrediction.amount;

    if (itemGroupCategory === this.state.productType) {
      return (
        <TouchableOpacity key={weekDeliveryPredictionId} style={styles.center} onPress={() => this.onListItemClick("ViewWeekDeliveryPrediction", predictionTableData)}>
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
    const itemGroups = await itemGroupService.listItemGroups();
    this.setState({ itemGroups: itemGroups });
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
    const weekDeliveryPredictions = await weekDeliveryPredictionService.listWeekDeliveryPredictions(undefined, undefined, undefined, undefined, undefined, undefined, 10);

    weekDeliveryPredictions.forEach((weekDeliveryPrediction) => {
      const weekDeliveryPredictionState: WeekDeliveryPredictionTableData[] = this.state.weekDeliveryPredictionTableData;
      const itemGroup = this.state.itemGroups.find(itemGroup => itemGroup.id === weekDeliveryPrediction.itemGroupId);
      weekDeliveryPredictionState.push({
        weekDeliveryPrediction: weekDeliveryPrediction,
        itemGroup: itemGroup ? itemGroup : {}
      });
      this.setState({ weekDeliveryPredictionTableData: weekDeliveryPredictionState });
    });
  }

  /**
   * Render method
   */
  public render() {
    if (this.state.loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View >
          <View style={[styles.center, styles.topViewWithButton]}>
            <View style={[styles.center,{flexDirection:"row", marginTop:30}]}>
              <Thumbnail square small source={PREDICTIONS_ICON} style={{marginRight:10}}/>
              <Text style={{ color: "black", fontWeight: '700', fontSize: 18 }}>Viikkoennusteet</Text>
            </View>
            <TouchableOpacity style={[styles.deliveriesButton, { width: "60%", height: 50, marginVertical: 30 }]} onPress={() => { this.props.navigation.navigate("NewWeekDeliveryPrediction", { itemGroups: this.state.itemGroups }) }}>
              <Text style={styles.buttonText}>Uusi viikkoennuste</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "white" }}>
            {
              this.state.weekDeliveryPredictionTableData.map((predictionTableData: WeekDeliveryPredictionTableData) => {
                return this.renderListItem(predictionTableData)
              })
            }
          </View>
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

export default connect(mapStateToProps, mapDispatchToProps)(WeekDeliveryPredictionScreen);
