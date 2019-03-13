import React, { Dispatch } from "react";
import { View, StyleSheet, Alert } from "react-native";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import ContractPrices from "./ContractPrices";
import ContractHeader from "./ContractHeader";
import ContractParties from "./ContractParties";
import ContractAmount from "./ContractAmount";
import ContractAreaDetails from "./ContractAreaDetails";
import ContractDeliveryPlace from "./ContractDeliveryPlace";
import ContractFooter from "./ContractFooter";
import ContractRejectModal from "./ContractRejectModal";
import { Contract, ItemGroup, Price, Contact, AreaDetail, DeliveryPlace } from "pakkasmarja-client";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import PakkasmarjaApi from "../../../api";
import { AccessToken, StoreState, ContractData, ContractDataKey } from "../../../types";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { styles } from "./styles";

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
  prices?: Price[],
  contract?: Contract,
  deliveryPlaces?: DeliveryPlace[]
  companyName: string,
  companyBusinessId: string,
  showPastPrices: boolean,
  companyApprovalRequired: boolean
  contractData: ContractData,
  rejectModalOpen: boolean
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
        deliveryPlaceComment: ""
      }
    };
  }

  /**
   * Component did mount
   */
  public componentDidMount = () => {
    if (this.props.navigation.getParam('itemGroup')) {
      this.setState({ itemGroup: this.props.navigation.getParam('itemGroup') });
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
      const contract = this.props.navigation.getParam('contract');
      this.setState({ contract: contract });
 
      this.updateContractData("quantityComment", contract.quantityComment);
      this.updateContractData("proposedQuantity", contract.proposedQuantity.toString());
      this.updateContractData("areaDetailValues", contract.areaDetails);
      this.updateContractData("deliveryPlaceId", contract.deliveryPlaceId.toString());
      this.updateContractData("deliveryPlaceComment", contract.deliveryPlaceComment);
      this.updateContractData("deliverAllChecked", contract.deliverAll);
    }
  }

  /**
   * On user input change
   * 
   * @param key key
   * @param value value
   */
  private updateContractData = (key: ContractDataKey, value: boolean | string | AreaDetail[]) => {
    const contractData = this.state.contractData;
    contractData[key] = value;

    this.setState({ contractData: contractData });
    this.checkIfCompanyApprovalNeeded();
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
    const currentContractPlaceId = this.state.contractData.deliveryPlaceId;

    if (contractQuantity != currentQuantity || contractPlaceId != currentContractPlaceId) {
      this.setState({ companyApprovalRequired: true });
    } else {
      this.setState({ companyApprovalRequired: false });
    }
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
      secondaryNavItems={[{
        "text": "Secondary 1",
        "link": "/secondary"
      }, {
        "text": "Secondary 2",
        "link": "/secondary"
      }, {
        "text": "Secondary 3",
        "link": "/secondary"
      }]}
    />
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

    contract.deliverAll = contractData.deliverAllChecked;
    contract.deliveryPlaceId = contractData.deliveryPlaceId;
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
    const pdfPath = await pdfService.findPdf(this.state.contract.id, new Date().getFullYear().toString());

    Alert.alert(
      'Lataus onnistui!',
      `PDF tiedosto on tallennettu polkuun ${pdfPath}. Palaa sopimuksiin painamalla OK.`,
      [
        {text: 'OK', onPress: () => this.props.navigation.navigate('Contracts', {})},
      ]
    );
  }

  /**
   * Render method
   */
  public render() {
    if (!this.state.itemGroup || !this.state.contact || !this.state.contract) {
      return (
        <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        </BasicLayout>
      );
    }

    return (
      <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
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
          />
          <ContractAreaDetails
            itemGroup={this.state.itemGroup}
            areaDetails={this.state.contract.areaDetails}
            areaDetailValues={this.state.contractData.areaDetailValues}
            isActiveContract={this.state.contract.status === "APPROVED"}
            onUserInputChange={this.updateContractData}
          />
          <ContractDeliveryPlace
            onUserInputChange={this.updateContractData}
            deliveryPlaces={this.state.deliveryPlaces}
            selectedPlaceId={this.state.contractData.deliveryPlaceId}
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractScreen);
