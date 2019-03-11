import React from "react";
import { Contact } from "pakkasmarja-client";
import { Text } from "native-base";
import { View } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";

/**
 * Interface for component props
 */
export interface Props {
  contact: Contact,
  companyName: string,
  companyBusinessId: string
};

/**
 * Interface for component state
 */
interface State {
};

export default class ContractParties extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  /**
   * Format farmer party details text
   */
  private formatFarmerPartyDetails = () => {
    if (!this.props.contact) {
      return;
    }

    if (this.props.contact.companyName) {
      return this.props.contact.companyName;
    }

    return `${this.props.contact.firstName} ${this.props.contact.lastName}`;
  }

  /**
   * Render method for contract parties component
   */
  public render() {
    return (
      <View style={{marginBottom: 10, marginTop: 10, paddingLeft:10, paddingRight:10}}>
        <Text style={{fontWeight: "bold", fontSize: 25}}>
          OSAPUOLET
        </Text>
        <Grid>
          <Row>
            <Col><Text style={{fontWeight: "bold"}}>Viljelijä</Text></Col>
            <Col><Text style={{fontWeight: "bold"}}>Yhtiö</Text></Col>
          </Row>
          <Row>
            <Col>
              <Text>{this.formatFarmerPartyDetails}</Text>
            </Col>
            <Col>
              <Text>{this.props.companyName}</Text>
              <Text>{this.props.companyBusinessId}</Text>
            </Col>
          </Row>
        </Grid>
      </View>
    );
  }
}