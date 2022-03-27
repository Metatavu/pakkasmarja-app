import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { Tabs, Tab, Thumbnail, Icon, DefaultTabBar } from "native-base";
import { TouchableOpacity, Image, View, Text, TouchableHighlight, Dimensions } from "react-native";
import { styles } from './styles.tsx'
import PakkasmarjaApi from "../../../api";
import { RED_LOGO, INCOMING_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO, FRESH_ICON, FROZEN_ICON } from "../../../static/images";
import { Delivery, ItemGroupCategory, OpeningHourPeriod, OpeningHourException, DeliveryPlace, OpeningHourWeekday, OpeningHourInterval, WeekdayType, DeliveryStatus } from "pakkasmarja-client";
import FeatherIcon from "react-native-vector-icons/Feather";
import BasicLayout from "../../layout/BasicLayout";
import strings from "../../../localization/strings";
import 'moment/locale/fi';
import { extendMoment } from "moment-range";
import _ from "lodash";
import { Picker } from "native-base";
import { StackNavigationOptions } from '@react-navigation/stack';

/**
 * Moment extended with moment-range
 */
import * as Moment from "moment";
const extendedMoment = extendMoment(Moment);
extendedMoment.locale("fi");

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveriesLoaded?: (deliveries: DeliveriesState) => void;
  itemGroupCategoryUpdate?: (itemGroupCategory: ItemGroupCategory) => void;
  deliveries?: DeliveriesState;
  itemGroupCategory?: ItemGroupCategory;
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  deliveries: Delivery[];
  freshProposalAmount: number;
  freshPlannedAmount: number;
  frozenProposalAmount: number;
  frozenPlannedAmount: number;
  deliveriesState?: DeliveriesState;
  initialCategory?: ItemGroupCategory;
  deliveryPlaces: DeliveryPlace[];
  deliveryPlacesOpeningHours: DeliveryPlaceOpeningHours[];
  openingHoursTableData: OpeningHoursTableItem[];
  selectedDeliveryPlaceOpeningHours?: DeliveryPlaceOpeningHours;
  openingHoursNotConfirmed: boolean;
  today?: moment.Moment;
  fourWeeksFromToday?: moment.Moment;
};

/**
 * Interface describing opening hours for single delivery place
 */
interface DeliveryPlaceOpeningHours {
  id: string;
  name: string;
  openingHourPeriods: OpeningHourPeriod[];
  openingHourExceptions: OpeningHourException[];
}

interface OpeningHoursTableItem {
  date: moment.Moment;
  dayData: OpeningHourException | OpeningHourWeekday;
  key: number;
  confirmed: boolean;
}

/**
 * Deliveries screen component class
 */
class DeliveriesScreen extends React.Component<Props, State> {

  private refreshInterval: any;

  private navigationFocusEventSubscription: any;

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      deliveries: [],
      freshProposalAmount: 0,
      freshPlannedAmount: 0,
      frozenProposalAmount: 0,
      frozenPlannedAmount: 0,
      deliveryPlaces: [],
      deliveryPlacesOpeningHours: [],
      openingHoursTableData: [],
      openingHoursNotConfirmed: false
    };
  }

  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => ({
    headerStyle: {
      height: 100,
      backgroundColor: "#E51D2A"
    },
    headerTitle: () => (
      <TopBar
        navigation={ navigation }
        showMenu
        showHeader={ false }
        showUser
      />
    ),
    headerTitleStyle: { width: Dimensions.get("window").width },
    headerTitleContainerStyle: {
      left: 0
    },
    headerLeft: () => (
      <TouchableHighlight onPress={ navigation.goBack }>
        <FeatherIcon
          name="chevron-left"
          color="#fff"
          size={ 40 }
          style={{ marginLeft: 30 }}
        />
      </TouchableHighlight>
    )
  });

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const { navigation, itemGroupCategoryUpdate } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!itemGroupCategoryUpdate) {
      return;
    }

    await Promise.all([
      this.loadDeliveriesData(),
      this.fetchDeliveryPlacesFromContract()
    ]);

    this.loadAmounts();
    await this.listDeliveryPlacesOpeningHours();

    this.refreshInterval = setInterval(this.refreshDeliveries, 1000 * 30);

    this.navigationFocusEventSubscription = navigation.addListener("focus", this.loadAmounts);
  }

  /**
   * Component will unmount life-cycle event
   */
  public componentWillUnmount = () => {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }

    this.props.navigation.removeListener(this.navigationFocusEventSubscription);
  }

  /**
   * Refresh deliveries
   */
  private refreshDeliveries = () => {
    this.loadDeliveriesData();
    this.loadAmounts();
  }

  /**
   * Load deliveries
   */
  private loadDeliveriesData = async () => {
    const { accessToken, deliveriesLoaded } = this.props;

    if (!accessToken) {
      return;
    }

    const api = new PakkasmarjaApi();
    const deliveriesService = api.getDeliveriesService(accessToken.access_token);
    const productsService = api.getProductsService(accessToken.access_token);

    const freshDeliveries = await deliveriesService.listDeliveries(accessToken.userId, undefined, "FRESH", undefined, undefined, undefined, undefined, undefined, 0, 10000);
    const frozenDeliveries = await deliveriesService.listDeliveries(accessToken.userId, undefined, "FROZEN", undefined, undefined, undefined, undefined, undefined, 0, 10000);
    const products = await productsService.listProducts(undefined, undefined, undefined, 0, 10000);

    const freshDeliveriesAndProducts = freshDeliveries.map(delivery => ({
      delivery: delivery,
      product: products.find(product => product.id === delivery.productId)
    }));

    const frozenDeliveriesAndProducts = frozenDeliveries.map((delivery) => ({
      delivery: delivery,
      product: products.find(product => product.id === delivery.productId)
    }));

    deliveriesLoaded && deliveriesLoaded({
      freshDeliveryData: freshDeliveriesAndProducts,
      frozenDeliveryData: frozenDeliveriesAndProducts
    });
  }

  /**
   * Fetches contract and extracts delivery place from it
   */
  private fetchDeliveryPlacesFromContract = async () => {
    const { accessToken } = this.props;

    if (!accessToken) {
      return;
    }

    const api = new PakkasmarjaApi();
    const contractsService = api.getContractsService(accessToken.access_token);
    const deliveryPlacesService = api.getDeliveryPlacesService(accessToken.access_token);
    const userContracts = await contractsService.listContracts("application/json", undefined, undefined, undefined, new Date().getFullYear());
    const uniqueDeliveryPlaceIds = _.uniq(userContracts.map(contract => contract.deliveryPlaceId));
    const deliveryPlaces = await Promise.all(uniqueDeliveryPlaceIds.map(deliveryPlacesService.findDeliveryPlace));

    this.setState({ deliveryPlaces: deliveryPlaces });
  }

  /**
   *    * load amounts
   */
  private loadAmounts = () => {
    const { deliveries } = this.props;

    if (!deliveries) {
      return;
    }

    const { freshDeliveryData, frozenDeliveryData } = deliveries;

    const freshProposals = this.filterDeliveryDataByStatus(freshDeliveryData, "PROPOSAL");
    const freshPlanned = this.filterDeliveryDataByStatus(freshDeliveryData, "PLANNED");
    const frozenProposals = this.filterDeliveryDataByStatus(frozenDeliveryData, "PROPOSAL");
    const frozenPlanned = this.filterDeliveryDataByStatus(frozenDeliveryData, "PLANNED");

    this.setState({
      freshProposalAmount: freshProposals.length,
      freshPlannedAmount: freshPlanned.length,
      frozenProposalAmount: frozenProposals.length,
      frozenPlannedAmount: frozenPlanned.length
    });
  }

  /**
   * Filters given delivery data by status
   *
   * @param data delivery data
   * @param status status
   */
  private filterDeliveryDataByStatus = (data: DeliveryProduct[], status: DeliveryStatus) => {
    return data.filter(({ delivery }) => delivery.status === status);
  }

  /**
   * Lists opening hours in every delivery place for the next four weeks
   */
  private listDeliveryPlacesOpeningHours = async () => {
    const { accessToken } = this.props;
    const { deliveryPlaces } = this.state;

    if (!accessToken || deliveryPlaces.length === 0) {
      return;
    }

    const openingHoursService = new PakkasmarjaApi().getOpeningHoursService(accessToken.access_token);
    const today = extendedMoment();
    const fourWeeksFromToday = extendedMoment(today).add(28, "day");

    const deliveryPlacesOpeningHoursPromises = deliveryPlaces.map(async deliveryPlace => {
      const name = deliveryPlace.name;
      const deliveryPlaceId = `${ deliveryPlace.id }`;

      const [openingHourExceptions, openingHourPeriods] = await Promise.all([
        openingHoursService.listOpeningHourExceptions(deliveryPlaceId),
        openingHoursService.listOpeningHourPeriods(deliveryPlaceId, today.toDate(), fourWeeksFromToday.toDate())
      ]);

      return {
        id: deliveryPlaceId,
        name: name || "",
        openingHourPeriods: openingHourPeriods,
        openingHourExceptions: openingHourExceptions
      };
    });

    const deliveryPlacesOpeningHours = await Promise.all(deliveryPlacesOpeningHoursPromises);

    this.setState({
      today,
      fourWeeksFromToday,
      deliveryPlacesOpeningHours,
      selectedDeliveryPlaceOpeningHours: deliveryPlacesOpeningHours[0]
    });

    this.createOpeningHoursTableData(deliveryPlacesOpeningHours[0]);
  }

  /**
   * Maps options for dropdown
   */
  private mapOptions = () => {
    return this.state.deliveryPlacesOpeningHours.map(openingHoursItem => (
      <Picker.Item
        key={ openingHoursItem.id }
        label={ openingHoursItem.name }
        value={ openingHoursItem }
      />
    ));
  }

  /**
   * Method for choosing delivery place opening hours
   *
   * @param itemValue item value
   */
  private chooseDeliveryPlaceOpeningHours = (itemValue: any) => {
    const { deliveryPlacesOpeningHours } = this.state;

    if (itemValue.id) {
      const place = deliveryPlacesOpeningHours.find(item => item.id === itemValue.id);

      if (place) {
        this.createOpeningHoursTableData(place);
        this.setState({ selectedDeliveryPlaceOpeningHours: place });
      }
    }
  }

  /**
   * Creates opening hours tale data
   *
   * @param deliveryPlacesOpeningHours delivery place opening hours
   */
  private createOpeningHoursTableData = (deliveryPlaceOpeningHours: DeliveryPlaceOpeningHours) => {
    const { today, fourWeeksFromToday } = this.state;

    if (!today || !fourWeeksFromToday) {
      return;
    }

    let openingHoursNotConfirmed = false;
    const { openingHourPeriods, openingHourExceptions } = deliveryPlaceOpeningHours;
    const sortedPeriodsList = [ ...openingHourPeriods ].sort((a, b) => {
      return extendedMoment(a.beginDate).diff(b.beginDate);
    });

    const dateRange = extendedMoment.range(today.startOf("day"), fourWeeksFromToday.endOf("day"));
    const dates = Array.from(dateRange.by("day"));

    const openingHoursTableData = dates.map((date, index): OpeningHoursTableItem => {
      const foundException = openingHourExceptions.find(exception =>
        extendedMoment(exception.exceptionDate).isSame(date, "day")
      );

      if (foundException) {
        return {
          date: date,
          dayData: foundException,
          key: index,
          confirmed: true
        };
      }

      const periodIndex = sortedPeriodsList.findIndex(period => {
        const range = extendedMoment.range(
          extendedMoment(period.beginDate).startOf("day"),
          extendedMoment(period.endDate).endOf("day")
        );

        return range.contains(date);
      });

      const confirmed = periodIndex > -1;
      if (!confirmed && !openingHoursNotConfirmed) {
        openingHoursNotConfirmed = true;
      }

      const period = confirmed ?
        sortedPeriodsList[periodIndex] :
        sortedPeriodsList[sortedPeriodsList.length -1];

      const weekday = period.weekdays.find(weekday => weekday.dayType === this.getWeekdayType(date));

      return {
        date: date,
        dayData: weekday!,
        key: index,
        confirmed: confirmed
      };
    });

    this.setState({
      openingHoursTableData,
      openingHoursNotConfirmed
    });
  }

  /**
   * Update item group category
   */
  private updateItemGroupCategory = (itemGroupCategory: ItemGroupCategory) => {
    const { accessToken, itemGroupCategoryUpdate } = this.props;
    const { initialCategory } = this.state;

    if (!accessToken) {
      return;
    }

    if (!initialCategory) {
      this.setState({ initialCategory: itemGroupCategory });
    }

    itemGroupCategoryUpdate?.(itemGroupCategory);
  }

  /**
   * On delivery item click
   *
   * @param screen screen
   * @param type type
   */
  private onDeliveryItemClick = (screen: string, itemGroupCategory: ItemGroupCategory) => {
    this.updateItemGroupCategory(itemGroupCategory);
    this.props.navigation.navigate(screen);
  }

  /**
   * Render list item
   * @param deliveryList list of deliveries
   * @param itemGroupCategory item group category
   * @returns delivery list component structure
   */
  private renderDeliveryList = (deliveryList: {}[], itemGroupCategory: ItemGroupCategory) => {
    const titleText = itemGroupCategory == "FRESH" ? strings.freshDeliveries : strings.frozenDeliveries;
    const titleIcon = itemGroupCategory == "FRESH" ? FRESH_ICON : FROZEN_ICON;

    return (
      <View style={{ flex: 1, flexDirection: "column", marginTop: 40 }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 60, marginBottom: 30 }}>
          <Thumbnail source={ titleIcon } style={{ height: 50, width: 50 }}/>
          <Text style={{ fontWeight: "400", fontSize: 35, color: "#000", marginLeft: 20 }}>
            { titleText }
          </Text>
        </View>
        {
          deliveryList.map((listItem: any) => {
            const plannedAmount: number = itemGroupCategory == "FRESH" ? listItem.freshPlannedAmount : listItem.frozenPlannedAmount;
            const proposalAmount: number = itemGroupCategory == "FRESH" ? listItem.freshProposalAmount : listItem.frozenProposalAmount;

            return (
              <TouchableOpacity
                key={ listItem.screen }
                onPress={ () => this.onDeliveryItemClick(listItem.screen, itemGroupCategory) }
              >
                <View
                  key={ listItem.screen }
                  style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 35 }}
                >
                  <View style={{ width: 40, alignContent: "center", alignItems: "center", paddingLeft: 5, paddingRight: 5 }}>
                    <Image
                      style={{ flex: 1, width: 40, resizeMode: 'contain' }}
                      source={ listItem.icon }
                    />
                  </View>
                  <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: 'center' }}>
                    <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                      { listItem.name }
                    </Text>
                  </View>
                  {
                    listItem.screen == "Proposals" && proposalAmount > 0 ?
                      <View style={{ justifyContent: "center" }}>
                        <View style={ styles.roundColoredView }>
                          <Text style={ styles.roundViewText }>
                            { proposalAmount }
                          </Text>
                        </View>
                      </View>
                      :
                      null
                  }
                  {
                    listItem.screen == "IncomingDeliveries" && plannedAmount > 0 ?
                      <View style={{ justifyContent: "center" }}>
                        <View style={ styles.roundColoredView }>
                          <Text style={ styles.roundViewText }>
                            { plannedAmount }
                          </Text>
                        </View>
                      </View>
                      :
                      null
                  }
                </View>
              </TouchableOpacity>
            );
          })
        }
      </View>
    );
  }

  /**
   * Renders opening hour table data
   */
  private renderOpeningHourTableData = (): JSX.Element[] | undefined => {
    const { openingHoursTableData } = this.state;

    if (openingHoursTableData.length < 1) {
      return;
    }

    return openingHoursTableData.map(({ date, dayData, key, confirmed }) =>
      this.renderOpeningHourDay(date, dayData, key, confirmed)
    );
  }

  /**
   * Get opening hour weekday type
   *
   * @param date moment date
   * @returns weekday type as WeekdayType
   */
  private getWeekdayType = (date: moment.Moment): WeekdayType | undefined => [
    WeekdayType.MONDAY,
    WeekdayType.TUESDAY,
    WeekdayType.WEDNESDAY,
    WeekdayType.THURSDAY,
    WeekdayType.FRIDAY,
    WeekdayType.SATURDAY,
    WeekdayType.SUNDAY
  ][date.weekday()];

    /**
   * Renders single opening hour day
   *
   * @param date date of day
   * @param dayObject day object
   * @param key element key
   * @returns day as JSX element
   */
  private renderOpeningHourDay = (
    date: moment.Moment,
    dayObject: OpeningHourException | OpeningHourWeekday,
    key: number,
    confirmed: boolean
  ): JSX.Element => (
    <View key={ key } style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row' }}>
      <View style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: 'stretch',
        borderBottomWidth: 1,
        borderRightWidth: 1,
        padding: 5
      }}>
        <Text style={{ marginRight: 5 }}>
          { date.format("dd DD.MM.YYYY") }
        </Text>
        { !confirmed &&
          <Icon
            name="asterisk"
            type="FontAwesome5"
            style={{ color: "red", fontSize: 10 }}
          />
        }
      </View>
      <View style={{ flex: 1, alignSelf: 'stretch', borderBottomWidth: 1, padding: 5 }}>
        { dayObject.hours.length > 0 &&
          this.renderOpeningHourIntervals(dayObject.hours) ||
          <Text key={ dayObject.id }>{ "Suljettu" }</Text>
        }
      </View>
    </View>
  );

  /**
   * Renders opening hour intervals
   *
   * @param hours opening hour intervals
   */
  private renderOpeningHourIntervals = (hours: OpeningHourInterval[]) => {
    return hours.map(hour =>
      <Text key={ hour.id }>
        { `${extendedMoment(hour.opens).format('HH:mm')} - ${extendedMoment(hour.closes).format('HH:mm')}` }
      </Text>
    );
  }

  /**
   * Render method
   */
  public render() {
    const { accessToken, navigation, itemGroupCategory } = this.props;
    const {
      selectedDeliveryPlaceOpeningHours,
      openingHoursNotConfirmed,
      freshProposalAmount,
      freshPlannedAmount,
      frozenProposalAmount,
      frozenPlannedAmount
    } = this.state;

    const deliveryList = [{
      freshProposalAmount: freshProposalAmount,
      frozenProposalAmount: frozenProposalAmount,
      name: "Ehdotukset",
      screen: "Proposals",
      icon: RED_LOGO
    }, {
      frozenPlannedAmount: frozenPlannedAmount,
      freshPlannedAmount: freshPlannedAmount,
      name: "Tulevat toimitukset",
      screen: "IncomingDeliveries",
      icon: INCOMING_DELIVERIES_LOGO
    }, {
      name: "Tehdyt toimitukset",
      screen: "PastDeliveries",
      icon: COMPLETED_DELIVERIES_LOGO
    }];

    const canManageDeliveries = accessToken ?
      accessToken.realmRoles.indexOf("update-other-deliveries") > -1 :
      false;

    if (itemGroupCategory === undefined) {
      return (
        <BasicLayout navigation={ navigation } displayFooter>
          <View style={ styles.categorySelectionView }>
            <TouchableOpacity
              style={ styles.freshButton }
              key={ ItemGroupCategory.FRESH }
              onPress={ () => this.updateItemGroupCategory("FRESH") }
            >
              <View style={{ paddingLeft: 5, paddingRight: 5 }}>
                <Thumbnail source={ FRESH_ICON } small />
              </View>
              <Text style={ styles.categoryButtonText }>
                { strings.freshDeliveries }
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ styles.frozenButton }
              key={ ItemGroupCategory.FROZEN }
              onPress={ () => this.updateItemGroupCategory("FROZEN") }
            >
              <View style={{ paddingLeft: 5, paddingRight: 5 }}>
                <Thumbnail source={ FROZEN_ICON } small/>
              </View>
              <Text style={ styles.categoryButtonText }>
                { strings.frozenDeliveries }
              </Text>
            </TouchableOpacity>
          </View>
        </BasicLayout>
      );
    } else {
      const initialTab = this.state.initialCategory === "FRESH" ? 0 : 1;

      return (
        <BasicScrollLayout
          navigation={ navigation }
          backgroundColor="#fff"
          displayFooter
        >
          <Tabs
            initialPage={ initialTab }
            tabBarUnderlineStyle={{ backgroundColor: "#fff" }}
            renderTabBar={ (props: any) => <DefaultTabBar {...{ ...props, tabStyle: Object.create(props.tabStyle) }}/> }
          >
            <Tab
              activeTabStyle={{ ...styles.activeTab, ...styles.tab }}
              activeTextStyle={ styles.activeText }
              textStyle={{ color: "#fff" }}
              tabStyle={ styles.tab }
              heading={ strings.freshDeliveries }
            >
              { this.renderDeliveryList(deliveryList, "FRESH") }
              { canManageDeliveries &&
                <TouchableOpacity onPress={ () => this.onDeliveryItemClick("ManageDeliveries", "FRESH") }>
                  <View style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 80 }}>
                    <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: "center" }}>
                      <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                        { strings.deliveryReception }
                    </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              }
            </Tab>
            <Tab
              activeTabStyle={{ ...styles.activeTab, ...styles.tab }}
              activeTextStyle={ styles.activeText }
              textStyle={{ color: "#fff" }}
              tabStyle={ styles.tab }
              heading={ strings.frozenDeliveries }
            >
              { this.renderDeliveryList(deliveryList, "FROZEN") }
              { canManageDeliveries &&
                <TouchableOpacity onPress={ () => this.onDeliveryItemClick("ManageDeliveries", "FROZEN") }>
                  <View style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 80 }}>
                    <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: 'center' }}>
                      <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                        { strings.deliveryReception }
                    </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              }
            </Tab>
          </Tabs>
          <View style={{ width: "100%", padding: 20 }}>
            <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
              Aukioloajat
            </Text>
            <Picker
              selectedValue={ selectedDeliveryPlaceOpeningHours }
              mode="dropdown"
              onValueChange={ this.chooseDeliveryPlaceOpeningHours }
            >
              { this.mapOptions() }
            </Picker>
          </View>
          { openingHoursNotConfirmed &&
            <View style={{ marginLeft: 20, marginBottom: 10, flex: 1, flexDirection: "row", alignItems: "center" }}>
              <Icon
                name="asterisk"
                type="FontAwesome5"
                style={{ color: "red", fontSize: 10, marginRight: 5 }}
              />
              <Text>Aukioloajat voivat vielä muuttua</Text>
            </View>
          }
          { selectedDeliveryPlaceOpeningHours &&
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 20,
                marginRight: 20,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                marginBottom: 20
              }}
            >
              { this.renderOpeningHourTableData() }
            </View>
          }
        </BasicScrollLayout>
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
    itemGroupCategory: state.itemGroupCategory,
    deliveries: state.deliveries,
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
    itemGroupCategoryUpdate: (itemGroupCategory: ItemGroupCategory) => dispatch(actions.itemGroupCategoryUpdate(itemGroupCategory)),
    deliveriesLoaded: (deliveries: DeliveriesState) => dispatch(actions.deliveriesLoaded(deliveries))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeliveriesScreen);
