import React from "react";
import { Text } from "native-base";
import { View, TouchableOpacity, StyleSheet, Picker, TextInput } from "react-native";
import Modal from "react-native-modal";
import { ItemGroup } from "pakkasmarja-client";

/**
 * Interface for component props
 */
interface Props {
  modalOpen: boolean,
  closeModal: () => void,
  itemGroups: ItemGroup[],
  selectedBerry: string,
  onSelectedBerryChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onQuantityCommentChange: (value: string) => void;
  sendContractProposalClicked: () => void;
  quantity: string,
  quantityComment: string,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
};

export default class ContractProposalModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false
    };
  }

  /**
   * Close modal
   */
  private closeModal = () => {
    this.props.closeModal();
  }

  /**
   * Render method for contract modal component
   */
  public render() {
    const styles = StyleSheet.create({
      modalView: {
        backgroundColor: "white",
        height: 470,
        padding: 15,
        paddingBottom: 20,
        marginBottom: 15
      },
      contentHeader: {
        fontWeight: "bold",
        fontSize: 25,
        paddingBottom: 20
      },
      Text: {
        fontSize: 20,
        paddingTop: 7,
        paddingBottom: 7
      },
      smallRedButton: {
        width: "47%",
        height: 50,
        backgroundColor: "#e01e36",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20
      },
      smallWhiteButton: {
        width: "47%",
        height: 50,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        borderColor: "red",
        borderWidth: 2
      },
      flexView: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between'
      },
      smallWhiteButtonText: {
        color: "#e01e36",
        fontSize: 22,
        fontWeight: "500"
      },
      buttonText: {
        color: "white",
        fontSize: 22,
        fontWeight: "500"
      },
      textInput: {
        backgroundColor: "white",
        borderColor: "red",
        borderWidth: 1,
        borderRadius: 4,
      }
    });
    return (
      <View style={{ marginTop: 22 }}>
        <Modal isVisible={this.props.modalOpen}>
          <View style={styles.modalView}>
            <View>
              <Text style={styles.contentHeader}>
                Ehdota sopimusta jostain muusta marjasta
              </Text>
            </View>
            <View>
              <View style={{
                  height: 50,
                  width: "100%",
                  backgroundColor: 'white',
                  borderColor: "red",
                  borderWidth: 1,
                  borderRadius: 4
                }}>
              <Picker
                selectedValue={this.props.selectedBerry}
                style={{height:50,width:"100%", color:"black"}}
                onValueChange={(itemValue, itemIndex) =>
                  this.props.onSelectedBerryChange(itemValue)
                }>
                {
                  this.props.itemGroups.map((itemGroup) => {
                    return (
                      <Picker.Item key={itemGroup.id} label={itemGroup.name || ""} value={itemGroup.id} />
                    );
                  })
                }
              </Picker>
              </View>
            </View>
            <View>
              <Text style={styles.Text}>Määrä</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={this.props.quantity}
                onChangeText={(text: string) => this.props.onQuantityChange(text)}
              />
            </View>
            <View>
              <Text style={styles.Text}>Kommentti</Text>
              <TextInput
                multiline={true}
                numberOfLines={4}
                style={styles.textInput}
                value={this.props.quantityComment}
                onChangeText={(text: string) => this.props.onQuantityCommentChange(text)}
              />
            </View>
            <View style={[styles.flexView, {marginTop:20}]}>
              <TouchableOpacity style={styles.smallWhiteButton} onPress={this.closeModal}>
                <Text style={styles.smallWhiteButtonText}>Sulje</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallRedButton} onPress={this.props.sendContractProposalClicked}>
                <Text style={styles.buttonText}>Lähetä</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}