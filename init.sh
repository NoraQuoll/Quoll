echo "----------------------"
echo "set access for contract quo"

npx ts-node scripts/Init/1.set_access.ts
npx ts-node scripts/Init/2.set_params_quo_reward_pool.ts
npx ts-node scripts/Init/3.set_params_masterchef.ts
npx ts-node scripts/Init/4.set_operator.ts
npx ts-node scripts/Init/5.1.set_params_wombat_voter_proxy.ts
npx ts-node scripts/Init/5.2.set_voter.ts
npx ts-node scripts/Init/5.3.set_bribe_manager.ts
npx ts-node scripts/Init/5.4.set_birbe_caller_fee.ts
npx ts-node scripts/Init/5.5.set_bribe_protocol_fee.ts
npx ts-node scripts/Init/5.6.set_bribe_fee_collector.ts
npx ts-node scripts/Init/5.7.transfer_ownership.ts
npx ts-node scripts/Init/6.1.set_params.ts
npx ts-node scripts/Init/6.3.set_fee.ts
npx ts-node scripts/Init/11.set_params.ts
npx ts-node scripts/Init/15.set_params.ts
npx ts-node scripts/Init/16.set_params.ts
npx ts-node scripts/quo-token/set_factor.ts


