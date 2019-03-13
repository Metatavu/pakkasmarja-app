import React from "react";
import { Text } from "native-base";
import { View, TouchableOpacity } from "react-native";
import { styles } from "./styles";

/**
 * Interface for component props
 */
interface Props {
  isActiveContract: boolean,
  goBack: () => void,
  acceptContract: () => void,
  declineContract: () => void,
  downloadContractPdf: () => void,
  approveButtonText: string,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
};

export default class ContractFooter extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  /**
   * Render method for contract parties component
   */
  public render() {
    return (
      <View style={styles.WhiteContentView}>
        {
          this.props.isActiveContract &&
          <View>
            <TouchableOpacity style={{ marginBottom: 25 }} onPress={this.props.downloadContractPdf}>
              <Text style={styles.linkStyle}>
                Lataa sopimus PDF - muodossa.
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bigRedButton} onPress={this.props.goBack}>
              <Text style={styles.buttonText}>
                TAKAISIN
              </Text>
            </TouchableOpacity>
          </View>
        }
        {
          !this.props.isActiveContract &&
          <View>
            <View style={styles.flexView}>
              <TouchableOpacity style={styles.smallRedButton} onPress={this.props.goBack}>
                <Text style={styles.buttonText}>
                  TAKAISIN
              </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallWhiteButton} onPress={this.props.declineContract}>
                <Text style={styles.smallWhiteButtonText}>
                  EN HYVÄKSY
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.bigRedButton} onPress={this.props.acceptContract}>
              <Text style={styles.buttonText}>
                {this.props.approveButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        }

      </View>
    );
  }
}