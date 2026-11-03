"use client";
import { useUI } from "@/store/ui-store";
import { CustomerDialog } from "./customer-dialog";
import { ProductDialog, StockDialog } from "./inventory-dialogs";
import { ItemDialog } from "./item-dialog";
import { CorrectPaymentDialog, ReceiptDialog } from "./payment-dialogs";
import { RiderDialog } from "./rider-dialog";

/** Renders whichever modal is open in the UI store. */
export function Modals() {
  const modal = useUI((s) => s.modal);
  const close = useUI((s) => s.close);
  if (!modal) return null;
  switch (modal.type) {
    case "customer":
      return <CustomerDialog onClose={close} />;
    case "item":
      return <ItemDialog key={`${modal.customerId}-${modal.code}`} customerId={modal.customerId} code={modal.code} lockCustomer={modal.lockCustomer} onClose={close} />;
    case "product":
      return <ProductDialog onClose={close} />;
    case "stock":
      return <StockDialog code={modal.code} pname={modal.pname} onClose={close} />;
    case "rider":
      return <RiderDialog key={modal.rider?.id ?? "new"} rider={modal.rider} onClose={close} />;
    case "correct":
      return <CorrectPaymentDialog key={modal.payId} payId={modal.payId} onClose={close} />;
    case "receipt":
      return <ReceiptDialog onClose={close} />;
  }
}
