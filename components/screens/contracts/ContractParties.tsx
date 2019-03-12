import React from "react";
import { Contact } from "pakkasmarja-client";
import { Text } from "native-base";
import { View } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";

/**
 * Interface for component props
 */
interface Props {
  contact: Contact,
  companyName: string,
  companyBusinessId: string,
  styles?:any
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
  private renderFarmerPartyDetails = () => {
    if (!this.props.contact) {
      return <Text></Text>;
    }

    if (this.props.contact.companyName) {
      return (
        <Text style={this.props.styles.textSize}>
          {this.props.contact.companyName}
        </Text>
      );
    }

    return (
      <Text style={this.props.styles.textSize}>
        {`${this.props.contact.firstName} ${this.props.contact.lastName}`}
      </Text>
    );
  }

  /**
   * Render method for contract parties component
   */
  public render() {
    return (
      <View style={this.props.styles.WhiteContentView}>
        <Text style={this.props.styles.ContentHeader}>
          OSAPUOLET
        </Text>
        <Grid>
          <Row>
            <Col><Text style={[this.props.styles.TextBold, this.props.styles.textSize]}>Viljelijä</Text></Col>
            <Col><Text style={[this.props.styles.TextBold, this.props.styles.textSize]}>Yhtiö</Text></Col>
          </Row>
          <Row>
            <Col>
              {this.renderFarmerPartyDetails()}
            </Col>
            <Col>
              <Text style={this.props.styles.textSize}>{this.props.companyName}</Text>
              <Text style={this.props.styles.textSize}>{this.props.companyBusinessId}</Text>
            </Col>
          </Row>
        </Grid>
      </View>
    );
  }
}