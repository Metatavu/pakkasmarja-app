import React from "react";
import { ItemGroup, Contact, Price, ContractModel } from "../../../types";
import { Text } from "native-base";
import { View, StyleSheet } from "react-native";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import ContractPrices from "./ContractPrices";
import ContractHeader from "./ContractHeader";
import ContractParties from "./ContractParties";
import ContractAmount from "./ContractAmount";
import { Contract } from "pakkasmarja-client";

/**
 * Interface for component props
 */
interface Props {
  navigation: any
};

interface UserInputs {
  proposedQuantity: string
  deliverAllChecked: boolean
}

/**
 * Interface for component state
 */
interface State {
  itemGroup?: ItemGroup,
  contact?: Contact,
  contracts?: Contract[],
  prices?: Price[],
  contract?: Contract,
  companyName: string,
  companyBusinessId: string,
  showPastPrices: boolean,
  contractData: any
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
        deliverAllChecked: false
      }
    };
  }

  /**
   * Component did mount
   */
  public componentDidMount = () => {
    if (this.props.navigation.getParam('itemGroup')) {
      this.setState({ itemGroup: this.props.navigation.getParam('itemGroup') });
      console.log(this.props.navigation.getParam('itemGroup'))
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
  }

  /**
   * On user input change
   */
  private onUserInputChange = (key: string, value: boolean | string) => {
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
            onUserInputChange={this.onUserInputChange}
            proposedAmount={this.state.contractData.proposedQuantity}
            deliverAllChecked={this.state.contractData.deliverAllChecked}
          />
        </View>
      </BasicLayout>
    );
  }
}