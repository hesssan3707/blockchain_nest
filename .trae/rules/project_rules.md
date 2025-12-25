we have a logic form like this:
if usdt equality of withdrawal amount is greater than confirmation_required_amount then
    send currency from WITHDRAWAL_PUBLIC_KEY,WITHDRAWAL_PRIVATE_KEY wallet
else
    send currency from SMALL_WITHDRAWAL_PUBLIC_KEY,SMALL_WITHDRAWAL_PRIVATE_KEY wallet
;
we have a logic with the name of "balance_collector" that collect users deposits to safe wallets,this service run and check if that user wallet has enough balance and if that balance is greater than "min_balance_collector_amount" column in currency table then send that balance to safe wallet,
if that balance is less than "min_balance_collector_amount" then do nothing;
every blockchain have a value in blockchain table with the name of "bpm"(block per minute) that define how many blocks generates in that blockchain per minute,based on this value we decide to read transaction with what interval;
