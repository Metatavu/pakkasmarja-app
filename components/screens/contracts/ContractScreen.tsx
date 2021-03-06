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

/**
 * Interface for component props
 */
interface Props {
  navigation: any,
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
    const itemGroup = this.props.navigation.getParam('itemGroup');
    if (itemGroup) {
      this.setState({ itemGroup: itemGroup });
    }

    if (this.props.navigation.getParam('contact')) {
      this.setState({ contact: this.props.navigation.getParam('contact') });
    }

    if (this.props.navigation.getParam('prices')) {
      this.setState({ prices: this.props.navigation.getParam('prices') });
    }

    if (this.props.navigation.getParam('deliveryPlaces')) {
      this.setState({ deliveryPlaces: this.props.navigation.getParam('deliveryPlaces') });
    }

    if (this.props.navigation.getParam('contract')) {
      const contract: Contract = this.props.navigation.getParam('contract');
      this.setState({ contract: contract });

      this.updateContractData("quantityComment", contract.quantityComment || "");
      this.updateContractData("proposedQuantity", contract.proposedQuantity ? contract.proposedQuantity.toString() : contract.contractQuantity ? contract.contractQuantity.toString() : "");
      this.updateContractData("areaDetailValues", contract.areaDetails || []);
      this.updateContractData("proposedDeliveryPlaceId", contract.deliveryPlaceId.toString());
      this.updateContractData("deliveryPlaceComment", contract.deliveryPlaceComment || "");
      this.updateContractData("deliverAllChecked", contract.deliverAll);
    }
    const appConfig: AppConfigOptions = await AppConfig.getAppConfig();

    if (appConfig && itemGroup && itemGroup.id) {
      const configItemGroups = appConfig["item-groups"];
      const itemGroupId = itemGroup.id;
      const configItemGroup: AppConfigItemGroupOptions = configItemGroups[itemGroupId];
      const requireAreaDetails = configItemGroup && configItemGroup["require-area-details"] ? true : false;
      const allowDeliveryAll = configItemGroup && configItemGroup["allow-delivery-all"] ? true : false;
      this.setState({ requireAreaDetails, allowDeliveryAll });
      this.validateContractData(this.state.contractData);
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
    contractData[key] = value;
    this.setState({ contractData: contractData });
    this.checkIfCompanyApprovalNeeded();
    this.validateContractData(contractData);
  }

  /**
   * Sets validation error text if contract data is not valid
   * @param contractData contract data
   */
  private validateContractData = (contractData: ContractData) => {
    const { itemGroup } = this.state;
    const minimumProfitEstimation = itemGroup ? itemGroup.minimumProfitEstimation : undefined;
    if (this.state.requireAreaDetails) {
      const { areaDetailValues } = this.state.contractData;
      if (areaDetailValues.length < 1) {
        this.setState({ validationErrorText: strings.fillAreaDetails });
        return;
      } else if (!this.allFieldsFilled(areaDetailValues)) {
        this.setState({ validationErrorText: strings.fillAllAreaDetailFields });
        return;
      }
    }

    const totalAmount = this.calculateTotalAmount(contractData.areaDetailValues, minimumProfitEstimation);
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
    if (!this.state.contract) {
      return;
    }

    const contractQuantity = this.state.contract.contractQuantity;
    const currentQuantity = this.state.contractData.proposedQuantity;
    const contractPlaceId = this.state.contract.deliveryPlaceId;
    const currentContractPlaceId = this.state.contractData.proposedDeliveryPlaceId;
    const contractDeliverAll = this.state.contract.deliverAll;
    const contractProposedDeliverAll = this.state.contractData.deliverAllChecked;
    if (contractQuantity != currentQuantity || contractPlaceId != currentContractPlaceId || contractDeliverAll != contractProposedDeliverAll) {
      this.setState({ companyApprovalRequired: true });
    } else {
      this.setState({ companyApprovalRequired: false });
    }
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
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
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
    if (!this.props.accessToken || !this.state.contract) {
      return;
    }

    const contractData = this.state.contractData;
    const contract = this.state.contract;

    contract.proposedDeliverAll = contractData.deliverAllChecked;
    contract.proposedDeliveryPlaceId = contractData.proposedDeliveryPlaceId;
    contract.deliveryPlaceComment = contractData.deliveryPlaceComment;
    contract.proposedQuantity = contractData.proposedQuantity;
    contract.quantityComment = contractData.quantityComment;

    if (contractData.areaDetailValues && contractData.areaDetailValues.length > 0) {
      const areaDetails: AreaDetail[] = [];
      contractData.areaDetailValues.forEach((areaDetailObject: any) => {
        areaDetails.push({
          size: areaDetailObject.size,
          species: areaDetailObject.species,
          name: areaDetailObject.name,
          profitEstimation: areaDetailObject.profitEstimation
        });
      });

      contract.areaDetails = areaDetails;
    }

    const api = new PakkasmarjaApi();
    const contractsService = api.getContractsService(this.props.accessToken.access_token);

    if (this.state.companyApprovalRequired) {
      contract.status = "ON_HOLD";
      await contractsService.updateContract(contract, contract.id || "");
      this.props.navigation.navigate('Contracts', {});
    } else {
      await contractsService.updateContract(contract, contract.id || "");

      const signAuthenticationServicesService = api.getSignAuthenticationServicesService(this.props.accessToken.access_token);
      const signAuthenticationServices = await signAuthenticationServicesService.listSignAuthenticationServices();

      this.props.navigation.navigate('ContractTerms', {
        contract: this.state.contract,
        authServices: signAuthenticationServices
      });
    }
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
    if (!this.props.accessToken || !this.state.contract || !this.state.contract.id) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}`);
    const pdfService = api.getPdfService(this.props.accessToken.access_token);
    const pdfPath = await pdfService.findPdf(this.state.contract.id, new Date().getFullYear().toString(), `${new Date().toLocaleDateString()}.pdf`);

    Alert.alert(
      'Lataus onnistui!',
      `PDF tiedosto on tallennettu polkuun ${pdfPath}. Palaa sopimuksiin painamalla OK.`,
      [
        { text: 'OK', onPress: () => this.props.navigation.navigate('Contracts', {}) },
      ]
    );
  }

  /**
   * Returns true if all fields of area detail values are filled
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
    const { proposedQuantity } = this.state.contractData;
    return proposedQuantity >= totalAmount;
  }

  /**
   * Returns total amount from area detail values
   * @param areaDetailValues area detail values
   * @param minimumProfit minimum profit, if predefined in contract
   * @returns total amount as number
   */
  private calculateTotalAmount = (areaDetailValues: AreaDetail[], minimumProfit?: number): number => {
    const hasItems = areaDetailValues.length > 0;
    return hasItems ? areaDetailValues.reduce((total, areaDetailValue) => {
      const estimation = minimumProfit || areaDetailValue.profitEstimation || 0;
      const hectares = areaDetailValue.size ? areaDetailValue.size : 0;
      return total += estimation * hectares;
    }, 0) : 0;
  }

  /**
   * Render method
   */
  public render() {
    if (!this.state.itemGroup || !this.state.contact || !this.state.contract) {
      return (
        <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        </BasicScrollLayout>
      );
    }

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={{ backgroundColor: "#fff", paddingTop: 10 }}>
          <ContractHeader
            styles={styles}
            itemGroup={this.state.itemGroup}
          />
          <ContractParties
            contact={this.state.contact}
            companyName={this.state.companyName}
            companyBusinessId={this.state.companyBusinessId}
          />
          <ContractPrices
            styles={styles}
            itemGroup={this.state.itemGroup}
            prices={this.state.prices}
          />
          <ContractAmount
            styles={styles}
            itemGroup={this.state.itemGroup}
            contract={this.state.contract}
            isActiveContract={this.state.contract.status === "APPROVED"}
            category={this.state.itemGroup.category || ""}
            onUserInputChange={this.updateContractData}
            contractAmount={this.state.contract.contractQuantity}
            proposedAmount={this.state.contractData.proposedQuantity}
            quantityComment={this.state.contractData.quantityComment}
            deliverAllChecked={this.state.contractData.deliverAllChecked}
            allowDeliveryAll={this.state.allowDeliveryAll}
          />
          {
            this.state.requireAreaDetails &&
            <ContractAreaDetails
              itemGroup={this.state.itemGroup}
              areaDetails={this.state.contract.areaDetails}
              areaDetailValues={this.state.contractData.areaDetailValues}
              isActiveContract={this.state.contract.status === "APPROVED"}
              onUserInputChange={this.updateContractData}
            />
          }
          <ContractDeliveryPlace
            onUserInputChange={this.updateContractData}
            deliveryPlaces={this.state.deliveryPlaces}
            selectedPlaceId={this.state.contractData.proposedDeliveryPlaceId ? this.state.contractData.proposedDeliveryPlaceId : this.state.contractData.deliveryPlaceId}
            deliveryPlaceComment={this.state.contractData.deliveryPlaceComment}
            isActiveContract={this.state.contract.status === "APPROVED"}
          />
          <ContractFooter
            isActiveContract={this.state.contract.status === "APPROVED"}
            goBack={this.goBackClicked}
            acceptContract={this.acceptContractClicked}
            declineContract={this.declineContractClicked}
            downloadContractPdf={this.downloadContractPdfClicked}
            approveButtonText={this.state.companyApprovalRequired ? "EHDOTA MUUTOSTA" : "HYVÄKSYN"}
            validationErrorText={this.state.validationErrorText}
          />
          <ContractRejectModal
            onUserInputChange={this.updateContractData}
            rejectComment={this.state.contractData.rejectComment}
            modalOpen={this.state.rejectModalOpen}
            closeModal={() => this.setState({ rejectModalOpen: false })}
            contract={this.state.contract}
            contractRejected={() => this.props.navigation.navigate('Contracts', {})}
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
