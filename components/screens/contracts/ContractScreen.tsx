import React from "react";
import { Text } from "native-base";
import { View, StyleSheet } from "react-native";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import ContractPrices from "./ContractPrices";
import ContractHeader from "./ContractHeader";
import ContractParties from "./ContractParties";
import ContractAmount from "./ContractAmount";
import ContractAreaDetails from "./ContractAreaDetails";
import ContractDeliveryPlace from "./ContractDeliveryPlace";
import ContractFooter from "./ContractFooter";
import { Contract, ItemGroup, Price, Contact, AreaDetail, DeliveryPlace } from "pakkasmarja-client";

/**
 * Interface for component props
 */
interface Props {
  navigation: any
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
  contractData: any,
};

export default class ContractScreen extends React.Component<Props, State> {

  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      companyName: "Pakkasmarja Oy",
      companyBusinessId: "0434204-0",
      showPastPrices: false,
      contractData: {
        proposedQuantity: "",
        deliverAllChecked: false,
        quantityComment: "",
        areaDetailValues: [],
        deliveryPlace: "",
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
    
    if (this.props.navigation.getParam('contract')) {
      this.setState({ contract: this.props.navigation.getParam('contract') });
    }

    if (this.props.navigation.getParam('deliveryPlaces')) {
      this.setState({ deliveryPlaces: this.props.navigation.getParam('deliveryPlaces') });
    }

    if (!this.state.contract || !this.state.contract.areaDetails) {
      return;
    }

    const areaDetailValues = this.state.contract.areaDetails;
    this.updateContractData("areaDetailValues", areaDetailValues);
  }

  /**
   * On user input change
   */
  private updateContractData = (key: string, value: boolean | string | AreaDetail[]) => {
    const contractData = this.state.contractData;
    contractData[key] = value;

    this.setState({ contractData: contractData });
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
  private acceptContractClicked = () => {
    console.log("Accepted", this.state.contractData)!
  }

  /**
   * Decline button clicked
   */
  private declineContractClicked = () => {
    console.log("Accepted", this.state.contractData)!
  }

  /**
   * Download contract as pdf
   */
  private downloadContractPdfClicked = () => {
    console.log("Download");
  }

  /**
   * Render method
   */
  public render() {
    const styles = StyleSheet.create({
      BlueContentView: {
        padding: 15,
        backgroundColor: "#dae7fa",
        paddingTop: 35,
        paddingBottom: 20,
        marginBottom: 15
      },
      WhiteContentView: {
        padding: 15,
        paddingBottom: 20,
      },
      readingText:{
        fontSize: 20
      },
      TextBold: {
        fontWeight: "bold"
      },
      ContentHeader: {
        fontWeight: "bold",
        fontSize: 25,
        paddingBottom: 20
      },
      InputStyle: {
        height: 40,
        width: "100%",
        borderColor: "red",
        backgroundColor: "white",
        borderWidth: 2.5,
        borderRadius: 30,
        marginTop: 8,
        marginBottom: 8,
        marginLeft:0
      },
      textWithSpace:{
        paddingTop:7,
        paddingBottom:7
      },
      textInput:{
        backgroundColor:"white",
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 4,
      }
    });
    if (!this.state.itemGroup || !this.state.contact || !this.state.contract) {
      return (
        <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        </BasicLayout>
      );
    }

    return (
      <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={{ backgroundColor: "#fff", paddingTop: 10 }}>
          <ContractHeader styles={styles} itemGroup={this.state.itemGroup} />
          <ContractParties styles={styles} contact={this.state.contact} companyName={this.state.companyName} companyBusinessId={this.state.companyBusinessId} />
          <ContractPrices styles={styles} itemGroup={this.state.itemGroup} prices={this.state.prices} />
          <ContractAmount
            styles={styles}
            itemGroup={this.state.itemGroup}
            contract={this.state.contract}
            isActiveContract={this.state.contract.status === "APPROVED"}
            category={this.state.itemGroup.category || ""}
            onUserInputChange={this.updateContractData}
            proposedAmount={this.state.contractData.proposedQuantity}
            quantityComment={this.state.contractData.quantityComment}
            deliverAllChecked={this.state.contractData.deliverAllChecked}
          />
          <ContractAreaDetails 
            styles={styles} 
            itemGroup={this.state.itemGroup}
            areaDetails={this.state.contract.areaDetails}
            areaDetailValues={this.state.contractData.areaDetailValues}
            isActiveContract={this.state.contract.status === "APPROVED"}
            onUserInputChange={this.updateContractData}
          />
          <ContractDeliveryPlace 
            styles={styles}
            onUserInputChange={this.updateContractData}
            deliveryPlaces={this.state.deliveryPlaces}
            selectedPlace={this.state.contractData.deliveryPlace}
            deliveryPlaceComment={this.state.contractData.deliveryPlaceComment}
            isActiveContract={this.state.contract.status === "APPROVED"}
          />
          <ContractFooter 
            isActiveContract={this.state.contract.status === "APPROVED"}
            goBack={this.goBackClicked}
            acceptContract={this.acceptContractClicked}
            declineContract={this.declineContractClicked}
            downloadContractPdf={this.downloadContractPdfClicked}
            styles={styles}
          />
        </View>
      </BasicLayout>
    );
  }
}