import { StyleSheet, Platform } from "react-native";

/**
 * Styles
 */
export const styles = StyleSheet.create({
  deliveryContainer: {
    padding: 15
  },
  tab: {
    backgroundColor: "#E51D2A"
  },
  activeTab: {
    color: "#fff",
    fontWeight: "bold"
  },
  activeText: {
    color: "#fff"
  },
  pickerWrap: {
    height: Platform.OS === "ios" ? 40 : 50,
    backgroundColor: '#fafafa',
    borderColor: "#e01e36",
    borderWidth: 1,
    borderRadius: 8
  },
  deliveriesButton: {
    backgroundColor: "#e01e36",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7
  },
  disabledButton: {
    backgroundColor: "#c6c6c6",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7
  },
  freshButton: {
    width: "60%",
    marginBottom: 20,
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#FF0000",
    borderRadius: 7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    elevation: 5
  },
  frozenButton: {
    width: "60%",
    padding: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#FF0000",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    elevation: 5
  },
  categoryButtonText: {
    fontWeight: "400",
    color: "#000000",
    fontSize: 16,
    paddingLeft: 5,
    paddingRight: 5
  },
  categorySelectionView: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  begindeliveryButton: {
    backgroundColor: "#42AD18",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7
  },
  proposalCheckButton: {
    backgroundColor: "#e01e36",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7
  },
  loaderContainer: {
    paddingTop: 30
  },
  textWithSpace: {
    paddingTop: 7,
    paddingBottom: 7
  },
  flexView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  contentHeader: {
    fontWeight: "bold",
    fontSize: 18,
    paddingBottom: 20
  },
  viewHeaderText: {
    color: "black",
    fontWeight: '700',
    fontSize: 18
  },
  text: {
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
    marginBottom: 5,
    borderRadius: 7
  },
  redButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#e01e36",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    borderRadius: 7
  },
  buttonText: {
    color: '#f2f2f2',
    fontWeight: "700"
  },
  smallWhiteButton: {
    width: "47%",
    height: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderColor: "#e01e36",
    borderWidth: 2,
    borderRadius: 7
  },
  whiteButton: {
    width: "100%",
    height: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#e01e36",
    borderWidth: 2,
    borderRadius: 7
  },
  smallWhiteButtonText: {
    color: "#e01e36",
    fontWeight: "600"
  },
  textInput: {
    backgroundColor: "white",
    borderColor: "#e01e36",
    borderWidth: 2,
    borderRadius: 4,
    color: "black"
  },
  listItemTitle: {
    fontWeight: "bold",
    fontSize: 18
  },
  listContainerStyle: {
    marginBottom: 20,
    marginTop: 50,
    borderTopColor: 'transparent'
  },
  listItemContainerStyle: {
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    paddingVertical: 5,
    marginVertical: 10
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  topViewWithButton: {
    flex: 1,
    backgroundColor: "#f2f2f2"
  },
  red: {
    color: "#e01e36"
  },
  lightRedBackGroundColor: {
    backgroundColor: "#FFD5CC"
  },
  green: {
    color: "#42AD18"
  },
  renderCustomListItem: {
    flex: 1,
    flexDirection: "row",
    padding: 15,
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1
  },
  textPrediction: {
    color: "black",
    fontSize: 16,
  },
  itemIconSize: {
    width: 24,
    height: 24
  },
  declineButton: {
    backgroundColor: "#B4B4B4",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7
  },
  roundColoredView: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: '#e01e36',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20
  },
  roundViewText: {
    fontSize: 14,
    color: "white"
  },
  deliveryQualityRoundView: {
    height: 28,
    width: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  deliveryQualityRoundViewText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600"
  },
  numericInputContainer: {
    width: "100%",
    height: 70,
    borderRadius: 7,
    borderColor: "#e01e36",
    borderWidth: 1.25,
    marginBottom: 10
  },
  dateContainerText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    backgroundColor: "#f2f2f2",
    borderBottomColor: "lightgrey",
    borderBottomWidth: 1,
    paddingVertical: 5
  },
  radioButtonContainer: {
    height: 26,
    width: 26,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e01e36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#e01e36',
  },
  noteModal:{
    width: "95%",
    height: 500,
    flex: 0,
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderColor: "#e01e36",
    borderWidth: 1.25,
    padding: 20,
    borderRadius: 7
  },
  buttonGroup: {
    flex:3,
    backgroundColor:"#E51D2A",
    elevation:3,
    shadowOffset: {width:0, height:1},
    alignItems: "center"
  },
  buttonGroupSelected: {
    flex:3,
    backgroundColor:"#E51D2A",
    elevation:3,
    shadowOffset: {width:0, height:1},
    alignItems: "center",
    borderBottomColor: "#fff",
    borderBottomWidth: 5
  },
  smallHeader: {
    marginTop: 10,
    marginBottom: 10
  },
  listItem: {
    fontSize: 16,
    marginTop: 5,
    marginBottom: 5
  }
});