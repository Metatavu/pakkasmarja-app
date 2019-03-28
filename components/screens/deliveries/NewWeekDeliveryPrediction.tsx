import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, WeekDay } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { styles } from "./styles.tsx";
import { WeekDeliveryPrediction, ItemGroup, WeekDeliveryPredictionDays } from "pakkasmarja-client";
import { Icon } from "native-base";
import NumericInput from 'react-native-numeric-input';
import moment from "moment";
import PakkasmarjaApi from "../../../api";

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
  itemGroups: ItemGroup[];
  selectedItemGroup: ItemGroup;
  itemGroupIndex: number;
  amount: number;
  weekDays: WeekDay[];
  lastWeeksDeliveryPredictionTotalAmount: number;
  averageDailyAmount: number;
  percentageAmount: string;
};

/**
 * New week delivery prediction component class
 */
class NewWeekDeliveryPrediction extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      itemGroups: [],
      lastWeeksDeliveryPredictionTotalAmount: 0,
      itemGroupIndex: 0,
      averageDailyAmount: 0,
      percentageAmount: "0",
      amount: 0,
      selectedItemGroup: {},
      weekDays: [
        { name: "monday", displayName: "Maanantai", value: false },
        { name: "tuesday", displayName: "Tiistai", value: false },
        { name: "wednesday", displayName: "Keskiviikko", value: false },
        { name: "thursday", displayName: "Torstai", value: false },
        { name: "friday", displayName: "Perjantai", value: false },
        { name: "saturday", displayName: "Lauantai", value: false },
        { name: "sunday", displayName: "Sunnuntai", value: false },
      ]
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    await this.setLastWeeksTotal();
    const itemGroups: ItemGroup[] = await this.props.navigation.getParam('itemGroups');
    this.setState({ itemGroups: itemGroups, selectedItemGroup: itemGroups[0] });

  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * Renders one radio button
   * 
   * @param selected selected
   * @param label label
   * @param index index
   */
  private renderRadioButton = (selected: boolean, label: string, index: number) => {
    return (
      <View key={label} style={{ flex: 1, flexDirection: "row", marginVertical: 5 }}>
        <TouchableOpacity style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingVertical: 5 }} onPress={() => {
          this.changeWeekDayValue(selected, index);
        }}>
          <View style={{ flex: 1 }}>
            <View style={{
              height: 26,
              width: 26,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#e01e36',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {
                selected ?
                  <View style={{
                    height: 12,
                    width: 12,
                    borderRadius: 6,
                    backgroundColor: '#e01e36',
                  }} />
                  : null
              }
            </View>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1.5, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={[styles.textPrediction, { paddingLeft: 15, paddingVertical: 5 }]}>
            {label}
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Sends new week delivery prediction
   */
  private createNewWeekDeliveryPrediction = async () => {
    if (!this.props.accessToken || !this.state.selectedItemGroup.id) {
      return;
    }

    const weekDeliveryPredictionDays: WeekDeliveryPredictionDays = {};

    this.state.weekDays.forEach((day: WeekDay) => {
      weekDeliveryPredictionDays[day.name] = day.value;
    });

    const weekDeliveryPrediction: WeekDeliveryPrediction = {
      itemGroupId: this.state.selectedItemGroup.id,
      userId: this.props.accessToken.userId,
      amount: this.state.amount,
      weekNumber: this.getWeekNumber(),
      year: this.getYear(),
      days: weekDeliveryPredictionDays
    }

    const Api = new PakkasmarjaApi();
    const weekDeliveryPredictionService = await Api.getWeekDeliveryPredictionsService(this.props.accessToken.access_token);
    await weekDeliveryPredictionService.createWeekDeliveryPrediction(weekDeliveryPrediction);

    this.props.navigation.navigate("Deliveries");
  }

  /**
   * Handle value change
   * 
   * @param value value
   */
  private handleValueChange = (value: number) => {
    const averageDailyAmount: number = Math.round(value / 9);
    let percentageAmount: string = "0";

    if (this.state.lastWeeksDeliveryPredictionTotalAmount > 0 && value > 0) {
      percentageAmount = ((value / this.state.lastWeeksDeliveryPredictionTotalAmount) * 100).toFixed(2); 
    }

    this.setState({ amount: value, averageDailyAmount: averageDailyAmount, percentageAmount: percentageAmount });
  }

  /**
   * Set last weeks total to state
   */
  private setLastWeeksTotal = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const lastWeekNumber: number = this.getWeekNumber() - 1 == -1 ? 52 : this.getWeekNumber() - 1;
    const Api = new PakkasmarjaApi();
    const weekDeliveryPredictionService = await Api.getWeekDeliveryPredictionsService(this.props.accessToken.access_token);
    const filteredByWeekNumber = await weekDeliveryPredictionService.listWeekDeliveryPredictions(undefined, undefined, undefined, lastWeekNumber);

    filteredByWeekNumber.forEach((weekDeliveryPrediction) => {
      const amount: number = weekDeliveryPrediction.amount;
      const totalAmount = this.state.lastWeeksDeliveryPredictionTotalAmount + amount;
      this.setState({ lastWeeksDeliveryPredictionTotalAmount: totalAmount });
    });
  }

  /**
   * Get week number
   * 
   * @return current week number
   */
  private getWeekNumber = () => {
    const date: Date = new Date();
    return Number(moment(date).format("W"));
  }

  /**
   * Get year
   * 
   * @return current year
   */
  private getYear = () => {
    const date: Date = new Date();
    return moment(date).year();
  }

  /**
   * Changes value of radio buttons
   * 
   * @param selected selected
   * @param index index
   */
  private changeWeekDayValue = (selected: boolean, index: number) => {
    const weekDays = this.state.weekDays;
    const day = weekDays[index];

    day.value = !selected;
    weekDays[index] = day

    this.setState({ weekDays });
  }

  /**
   * Changes item group
   * 
   * @param action action
   */
  private changeItemGroup = async (action: string) => {
    const maxValue: number = this.state.itemGroups.length - 1;
    const minValue: number = 0;

    if (action === "next" && this.state.itemGroupIndex !== maxValue) {
      await this.setState({ itemGroupIndex: this.state.itemGroupIndex + 1 });
    }

    if (action === "previous" && this.state.itemGroupIndex !== minValue) {
      await this.setState({ itemGroupIndex: this.state.itemGroupIndex - 1 });
    }

   await this.setState({ selectedItemGroup: this.state.itemGroups[this.state.itemGroupIndex] });
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
        <View style={{ flex: 1, flexDirection: "row", padding: 15 }}>
          <View style={styles.center}>
            <TouchableOpacity onPress={() => { this.changeItemGroup("previous") }} >
              <Icon style={styles.red} type="Entypo" name="chevron-left"></Icon>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 8, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontWeight: "bold", fontSize: 24, color: "black" }}>{this.state.selectedItemGroup.displayName}</Text>
          </View>
          <TouchableOpacity onPress={() => { this.changeItemGroup("next") }} >
            <Icon style={styles.red} type="Entypo" name="chevron-right"></Icon>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, marginBottom: 1 }}>
          <View style={[styles.lightRedBackGroundColor, { flex: 1, flexDirection: "row", paddingVertical: 10 }]}>
            <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start", paddingLeft: 20 }}>
              <Text style={styles.textPrediction}>Viime viikon toimitukset</Text>
            </View>
            <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingRight: 20 }} >
              <Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{`${this.state.lastWeeksDeliveryPredictionTotalAmount} kg`}</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.center, styles.lightRedBackGroundColor, { paddingVertical: 10 }]}>
            <TouchableOpacity onPress={ ()=>this.props.navigation.navigate("ViewAllDeliveries")}>
              <Text style={styles.red}>Katso kaikki toimitukset</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 2, borderBottomColor: "black", borderBottomWidth: 0.7, paddingVertical: 20 }}>
          <View style={[styles.center, { paddingTop: 25, paddingBottom: 20 }]}>
            <Text style={{ fontSize: 24, color: "black", fontWeight: "500" }}>Ennuste ensi viikolle (KG)</Text>
          </View>
          <View style={styles.center}>
            <View style={[styles.center, { width: 370, height: 70, borderRadius: 7, borderColor: "#e01e36", borderWidth: 1.25, marginBottom: 10 }]}>
              <NumericInput
                value={this.state.amount}
                initValue={this.state.amount}
                onChange={(value: number) => this.handleValueChange(value)}
                totalWidth={360}
                totalHeight={50}
                iconSize={35}
                step={100}
                valueType='real'
                minValue={0}
                textColor='black'
                iconStyle={{ color: 'white' }}
                rightButtonBackgroundColor='#e01e36'
                leftButtonBackgroundColor='#e01e36'
                borderColor='transparent'
                rounded
              />
            </View>
          </View>
          <View style={styles.center}>
            <Text style={styles.textPrediction}>Keskimäärin<Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{` ${this.state.averageDailyAmount} kg/pv`}</Text></Text>
            <Text style={styles.textPrediction}>Muutos viime viikkoon <Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{` ${this.state.percentageAmount} %`}</Text></Text>
          </View>
        </View>
        <View style={[styles.center, { paddingVertical: 20 }]}>
          <Text style={{ fontSize: 22, color: "black", fontWeight: "500" }}>Minä päivinä toimitat?</Text>
          <View style={[styles.center, { paddingVertical: 20 }]}>
            {
              this.state.weekDays.map((day, index) => {
                return (
                  this.renderRadioButton(day.value, day.displayName, index)
                );
              })

            }
          </View>
        </View>
        <View style={styles.center}>
          <TouchableOpacity style={[styles.deliveriesButton, { width: "70%", height: 60, marginTop: 10, marginBottom: 20 }]} onPress={() => { this.createNewWeekDeliveryPrediction() }}>
            <Text style={styles.buttonText}>Lähetä viikkoennuste</Text>
          </TouchableOpacity>
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

export default connect(mapStateToProps, mapDispatchToProps)(NewWeekDeliveryPrediction);
