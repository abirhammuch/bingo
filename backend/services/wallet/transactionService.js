/**
 * Transaction service helpers.
 * Models are not implemented in the current repo, so these methods return
 * canonical shapes that can be wired to persistence later.
 */
export const buildTransaction = ({
  telegramId,
  type,
  amount,
  status = "pending",
  reference = "",
  metadata = {},
}) => ({
  transactionId: `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  telegramId,
  type,
  amount,
  status,
  reference,
  metadata,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const formatTransactionResponse = (transaction) => ({
  success: true,
  transaction,
});
