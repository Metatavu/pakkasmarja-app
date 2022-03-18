import React, { Dispatch } from "react";
import { View, Alert, TouchableHighlight } from "react-native";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import ContractPrices from "./ContractPrices";
import ContractHeader from "./ContractHeader";
import ContractParties from "./ContractParties";
import ContractAmount from "./ContractAmount";
import ContractAreaDetails from "./ContractAreaDetails";
import ContractDeliveryPlace from "./ContractDeliveryPlace";
import ContractFooter from "./ContractFooter";
import ContractRejectModal from "./ContractRejectModal";
import { Contract, ItemGroup, ItemGroupPrice, Contact, AreaDetail, DeliveryPlace } from "pakkasmarja-client";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import PakkasmarjaApi from "../../../api";
import { AccessToken, StoreState, ContractData, ContractDataKey, AppConfigOptions, AppConfigItemGroupOptions } from "../../../types";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { styles } from "./styles";
import Icon from "react-native-vector-icons/Feather";
import AppConfig from "../../../utils/AppConfig";
import strings from "../../../localization/strings";
import { StackNavigationOptions } from '@react-navigation/stack';

/**
 * Interface for component props
 */
interface Props {
  navigation: any,
  route: any,
  accessToken?: AccessToken
};

/**
 * Interface for component state
 */
interface State {
  itemGroup?: ItemGroup,
  contact?: Contact,
  contracts?: Contract[],
  prices?: ItemGroupPrice[],
  contract?: Contract,
  deliveryPlaces?: DeliveryPlace[]
  companyName: string,
  companyBusinessId: string,
  showPastPrices: boolean,
  companyApprovalRequired: boolean
  contractData: ContractData,
  rejectModalOpen: boolean,
  allowDeliveryAll: boolean,
  requireAreaDetails: boolean,
  validationErrorText: string
};

/**
 * Class for contract screen component
 */
class ContractScreen extends React.Component<Props, State> {

  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      validationErrorText: "",
      allowDeliveryAll: false,
      requireAreaDetails: false,
      companyName: "Pakkasmarja Oy",
      companyBusinessId: "0434204-0",
      showPastPrices: false,
      companyApprovalRequired: false,
      rejectModalOpen: false,
      contractData: {
        rejectComment: "",
        proposedQuantity: 0,
        deliverAllChecked: false,
        quantityComment: "",
        areaDetailValues: [],
        deliveryPlaceId: "",
        proposedDeliveryPlaceId: "",
        deliveryPlaceComment: ""
      }
    };
  }

  /**
   * Component did mount
   */
  public componentDidMount = async () => {
    const { navigation, route } = this.props;
    const { contractData } = this.state;
    const {
      itemGroup,
      contact,
      prices,
      deliveryPlaces,
      contract
    } = route.params || {};

    navigation.setOptions(this.navigationOptions(navigation));

    if (itemGroup) {
      this.setState({ itemGroup: itemGroup });
    }

    if (contact) {
      this.setState({ contact: contact });
    }

    if (contact) {
      this.setState({ prices: prices });
    }

    if (deliveryPlaces) {
      this.setState({ deliveryPlaces: deliveryPlaces });
    }

    if (contract) {
      this.setState({ contract: contract });

      this.updateContractData("quantityComment", contract.quantityComment || "");
      this.updateContractData("proposedQuantity", contract.proposedQuantity?.toString() || contract.contractQuantity?.toString() || "");
      this.updateContractData("areaDetailValues", contract.areaDetails || []);
      this.updateContractData("proposedDeliveryPlaceId", contract.deliveryPlaceId.toString());
      this.updateContractData("deliveryPlaceComment", contract.deliveryPlaceComment || "");
      this.updateContractData("deliverAllChecked", contract.deliverAll);
    }
    const appConfig: AppConfigOptions = await AppConfig.getAppConfig();

    if (appConfig && itemGroup?.id) {
      const configItemGroups = appConfig["item-groups"];
      const configItemGroup: AppConfigItemGroupOptions = configItemGroups[itemGroup.id];
      const requireAreaDetails = configItemGroup && configItemGroup["require-area-details"] ? true : false;
      const allowDeliveryAll = configItemGroup && configItemGroup["allow-delivery-all"] ? true : false;
      this.setState({ requireAreaDetails, allowDeliveryAll });
      this.validateContractData(contractData);
    }
  }

  /**
   * On user input change
   *
   * @param key key
   * @param value value
   */
  private updateContractData = (key: ContractDataKey, value: boolean | string | AreaDetail[]) => {
    const { contractData } = this.state;

    this.setState({ contractData: { ...contractData, [key]: value } });
    this.checkIfCompanyApprovalNeeded();
    this.validateContractData(contractData);
  }

  /**
   * Sets validation error text if contract data is not valid
   * @param contractData contract data
   */
  private validateContractData = (contractData: ContractData) => {
    const { requireAreaDetails } = this.state;
    const { itemGroup } = this.state;

    if (requireAreaDetails) {
      const { areaDetailValues } = contractData;

      if (areaDetailValues.length < 1) {
        this.setState({ validationErrorText: strings.fillAreaDetails });
        return;
      }

      if (!this.allFieldsFilled(areaDetailValues)) {
        this.setState({ validationErrorText: strings.fillAllAreaDetailFields });
        return;
      }
    }

    const totalAmount = this.calculateTotalAmount(
      contractData.areaDetailValues,
      itemGroup?.minimumProfitEstimation
    );

    if (!this.isValidContractMinimumAmount(totalAmount)) {
      this.setState({ validationErrorText: strings.insufficientContractAmount });
      return;
    }

    this.setState({ validationErrorText: "" });
  }

  /**
   * Checks if company needs to approve changes made by user
   */
  private checkIfCompanyApprovalNeeded = () => {
    const { contract, contractData } = this.state;

    if (!contract) {
      return;
    }

    const companyApprovalNeeded = (
      contract.contractQuantity !== contractData.proposedQuantity ||
      contract.deliveryPlaceId !== contractData.proposedDeliveryPlaceId ||
      contract.deliverAll !== contractData.deliverAllChecked
    );

    this.setState({ companyApprovalRequired: companyApprovalNeeded });
  }

  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerTitle: () => (
        <TopBar
          navigation={ navigation }
          showMenu
          showHeader={ false }
          showUser
        />
      ),
      headerTitleContainerStyle: {
        left: 0
      },
      headerLeft: () => (
        <TouchableHighlight onPress={ navigation.goBack }>
          <Icon
            name="chevron-left"
            color="#fff"
            size={ 40 }
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
      )
    }
  };

  /**
   * Go back button clicked
   */
  private goBackClicked = () => {
    this.props.navigation.navigate('Contracts', {});
  }

  /**
   * Accept button clicked
   */
  private acceptContractClicked = async () => {
    const { accessToken, navigation } = this.props;
    const { contractData, contract, companyApprovalRequired } = this.state;

    if (!accessToken || !contract) {
      return;
    }

    const contractToCreate: Contract = {
      ...contract,
      proposedDeliverAll: contractData.deliverAllChecked,
      proposedDeliveryPlaceId: contractData.proposedDeliveryPlaceId,
      deliveryPlaceComment: contractData.deliveryPlaceComment,
      proposedQuantity: contractData.proposedQuantity,
      quantityComment: contractData.quantityComment
    };

    if (contractData.areaDetailValues.length) {
      contractToCreate.areaDetails = contractData.areaDetailValues.map(areaDetailObject => ({
        size: areaDetailObject.size,
        species: areaDetailObject.species,
        name: areaDetailObject.name,
        profitEstimation: areaDetailObject.profitEstimation
      }));
    }

    const api = new PakkasmarjaApi();
    const contractsService = api.getContractsService(accessToken.access_token);

    if (companyApprovalRequired) {
      contractToCreate.status = "ON_HOLD";
      await contractsService.updateContract(contractToCreate, contract.id || "");
      navigation.navigate('Contracts', {});
      return;
    }

    await contractsService.updateContract(contractToCreate, contract.id || "");

    const signAuthenticationServices = await api
      .getSignAuthenticationServicesService(accessToken.access_token)
      .listSignAuthenticationServices();

    navigation.navigate('ContractTerms', {
      contract: contract,
      authServices: signAuthenticationServices
    });
  }

  /**
   * Decline button clicked
   */
  private declineContractClicked = () => {
    this.setState({ rejectModalOpen: true });
  }

  /**
   * Download contract as pdf
   */
  private downloadContractPdfClicked = async () => {
    const { accessToken, navigation } = this.props;
    const { contract } = this.state;

    if (!accessToken || !contract?.id) {
      return;
    }

    const pdfPath = await new PakkasmarjaApi(REACT_APP_API_URL)
      .getPdfService(accessToken.access_token)
      .findPdf(
        contract.id,
        new Date().getFullYear().toString(),
        `${new Date().toLocaleDateString()}.pdf`
      );

    Alert.alert(
      'Lataus onnistui!',
      `PDF tiedosto on tallennettu polkuun ${pdfPath}. Palaa sopimuksiin painamalla OK.`,
      [{ text: 'OK', onPress: () => navigation.navigate('Contracts', {}) }]
    );
  }

  /**
   * Returns true if all fields of area detail values are filled
   *
   * @param areaDetailValues area detail values
   * @returns true if all fields are filled, otherwise false
   */
  private allFieldsFilled = (areaDetailValues: AreaDetail[]): boolean => {
    for (const areaDetail of areaDetailValues) {
      const { name, size, species } = areaDetail;

      if (!name || !size || !species) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns if contract proposed quantity is at least the total amount calculated from area details
   * @param totalAmount total amount calculated from area details
   * @returns true if proposed quantity is at least the total amount, otherwise false
   */
  private isValidContractMinimumAmount = (totalAmount: number): boolean => {
    return this.state.contractData.proposedQuantity >= totalAmount;
  }

  /**
   * Returns total amount from area detail values
   * @param areaDetailValues area detail values
   * @param minimumProfit minimum profit, if predefined in contract
   * @returns total amount as number
   */
  private calculateTotalAmount = (areaDetailValues: AreaDetail[], minimumProfit?: number): number => {
    return areaDetailValues.reduce((total, areaDetailValue) => {
      const estimation = minimumProfit ?? areaDetailValue.profitEstimation ?? 0;
      const hectares = areaDetailValue.size ?? 0;
      return total += estimation * hectares;
    }, 0);
  }

  /**
   * Render method
   */
  public render() {
    const { navigation } = this.props;
    const {
      itemGroup,
      contact,
      contract,
      companyName,
      companyBusinessId,
      prices,
      contractData,
      allowDeliveryAll,
      requireAreaDetails,
      deliveryPlaces,
      companyApprovalRequired,
      validationErrorText,
      rejectModalOpen
    } = this.state;

    if (!itemGroup || !contact || !contract) {
      return (
        <BasicScrollLayout
          navigation={ navigation }
          backgroundColor="#fff"
          displayFooter
        />
      );
    }

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <View style={{ backgroundColor: "#fff", paddingTop: 10 }}>
          <ContractHeader
            styles={ styles }
            itemGroup={ itemGroup }
          />
          <ContractParties
            contact={ contact }
            companyName={ companyName }
            companyBusinessId={ companyBusinessId }
          />
          <ContractPrices
            styles={styles}
            itemGroup={ itemGroup }
            prices={ prices }
          />
          <ContractAmount
            styles={ styles }
            itemGroup={ itemGroup }
            contract={ contract }
            isActiveContract={ contract.status === "APPROVED" }
            category={ itemGroup.category || "" }
            onUserInputChange={ this.updateContractData }
            contractAmount={ contract.contractQuantity }
            proposedAmount={ contractData.proposedQuantity }
            quantityComment={ contractData.quantityComment }
            deliverAllChecked={ contractData.deliverAllChecked }
            allowDeliveryAll={ allowDeliveryAll }
          />
          {
            requireAreaDetails &&
            <ContractAreaDetails
              itemGroup={ itemGroup }
              areaDetails={ contract.areaDetails }
              areaDetailValues={ contractData.areaDetailValues }
              isActiveContract={ contract.status === "APPROVED" }
              onUserInputChange={ this.updateContractData }
            />
          }
          <ContractDeliveryPlace
            onUserInputChange={ this.updateContractData }
            deliveryPlaces={ deliveryPlaces }
            selectedPlaceId={ contractData.proposedDeliveryPlaceId || contractData.deliveryPlaceId }
            deliveryPlaceComment={ contractData.deliveryPlaceComment }
            isActiveContract={ contract.status === "APPROVED" }
          />
          <ContractFooter
            isActiveContract={ contract.status === "APPROVED" }
            goBack={ this.goBackClicked }
            acceptContract={ this.acceptContractClicked }
            declineContract={ this.declineContractClicked }
            downloadContractPdf={ this.downloadContractPdfClicked }
            approveButtonText={ companyApprovalRequired ? "EHDOTA MUUTOSTA" : "HYVÄKSYN" }
            validationErrorText={ validationErrorText }
          />
          <ContractRejectModal
            onUserInputChange={ this.updateContractData }
            rejectComment={ contractData.rejectComment }
            modalOpen={ rejectModalOpen }
            closeModal={ () => this.setState({ rejectModalOpen: false }) }
            contract={ contract }
            contractRejected={ () => navigation.navigate('Contracts', {}) }
          />
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractScreen);
