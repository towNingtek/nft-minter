import * as bii from "./towningtek.js";

function closeModal() {
  $("#connctWallet").modal('hide');
}

document.getElementById("connectW").onclick = function() {
  closeModal();
  bii.connectWalletConnect();
}
document.getElementById("disconnectW").onclick = function() {
  closeModal();
  bii.disconnectWalletConnect();
}
document.getElementById("connectMetaMask").onclick = function() {
  closeModal();
  bii.connectMetaMask();
}
document.getElementById("purchase").onclick = function() {
  closeModal();
  bii.purchase();
}
/*
document.getElementById("remainder").onclick = function() {
    bii.getRemainder();
}
*/
