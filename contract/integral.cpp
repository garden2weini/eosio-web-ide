#include<eosio/eosio.hpp>
#include<eosio/asset.hpp>
#include<string>

using namespace eosio;
using std::string;

class [[eosio::contract]] integral : public contract {
public:
	using contract::contract;

	[[eosio::action]]
	void create( const name& issuer, const asset& maximum_supply){
		/*
		@param issuer - the business account that creates the  token,
		@param maximum_supply - the maximum supply set for the token created.
		*/
		require_auth(get_self());

		auto sym = maximum_supply.symbol;
    	check( sym.is_valid(), "invalid symbol name" );
    	check( maximum_supply.is_valid(), "invalid supply");
    	check( maximum_supply.amount > 0, "max-supply must be positive");

    	stats statstable( get_self(), sym.code().raw() );
    	auto existing = statstable.find( sym.code().raw() );
    	check( existing == statstable.end(), "token with symbol already exists" );

    	statstable.emplace( get_self(), [&]( auto& s ) {
       		s.supply.symbol = maximum_supply.symbol;
       		s.max_supply    = maximum_supply;
       		s.issuer        = issuer;
    	});
	}

	[[eosio::action]]
	void issue( const name& to, const asset& quantity, const string& memo ){
		/*
		@param to - the account to issue tokens to, it must be the same as the issuer,
        @param quntity - the amount of tokens to be issued,
        @memo - the memo string that accompanies the token issue transaction.
		*/
		auto sym = quantity.symbol;
    	check( sym.is_valid(), "invalid symbol name" );
    	check( memo.size() <= 256, "memo has more than 256 bytes" );

    	stats statstable( get_self(), sym.code().raw() );
    	auto existing = statstable.find( sym.code().raw() );
    	check( existing != statstable.end(), "token with symbol does not exist, create token before issue" );
    	const auto& st = *existing;
    	check( to == st.issuer, "tokens can only be issued to issuer account" );

    	require_auth( st.issuer );
    	check( quantity.is_valid(), "invalid quantity" );
    	check( quantity.amount > 0, "must issue positive quantity" );

    	check( quantity.symbol == st.supply.symbol, "symbol precision mismatch" );
    	check( quantity.amount <= st.max_supply.amount - st.supply.amount, "quantity exceeds available supply");

    	statstable.modify( st, same_payer, [&]( auto& s ) {
       		s.supply += quantity;
    	});

    	add_balance( st.issuer, quantity, st.issuer );
	}

	[[eosio::action]]
	void retire( const asset& quantity, const string& memo ){
		/*
		@param quantity - the quantity of tokens to retire,
        @param memo - the memo string to accompany the transaction.
		*/
		auto sym = quantity.symbol;
	    check( sym.is_valid(), "invalid symbol name" );
	    check( memo.size() <= 256, "memo has more than 256 bytes" );

	    stats statstable( get_self(), sym.code().raw() );
	    auto existing = statstable.find( sym.code().raw() );
	    check( existing != statstable.end(), "token with symbol does not exist" );
	    const auto& st = *existing;

	    require_auth( st.issuer );
	    check( quantity.is_valid(), "invalid quantity" );
	    check( quantity.amount > 0, "must retire positive quantity" );

	    check( quantity.symbol == st.supply.symbol, "symbol precision mismatch" );

	    statstable.modify( st, same_payer, [&]( auto& s ) {
	       s.supply -= quantity;
	    });

	    sub_balance( st.issuer, quantity );
	}

	 [[eosio::action]]
    void transfer( const name&    from, const name&    to, const asset&   quantity, const string&  memo  ){
    	/*
		@param owner - the account to transfer integral,
        @param from - the integral to transferr from,
        @param to - the integral to be transferred,
        @param memo - the memo string to accompany the transaction.
    	*/
    	check( from != to, "cannot transfer to self" );
	    require_auth( from );
	    check( is_account( to ), "to account does not exist");
	    auto sym = quantity.symbol.code();
	    stats statstable( get_self(), sym.raw() );
	    const auto& st = statstable.get( sym.raw() );

	    require_recipient( from );
	    require_recipient( to );

	    check( quantity.is_valid(), "invalid quantity" );
	    check( quantity.amount > 0, "must transfer positive quantity" );
	    check( quantity.symbol == st.supply.symbol, "symbol precision mismatch" );
	    check( memo.size() <= 256, "memo has more than 256 bytes" );

	    auto payer = has_auth( to ) ? to : from;

	    sub_balance( from, quantity );
	    add_balance( to, quantity, payer );
    }

	 [[eosio::action]]
    void open( const name& owner, const symbol& symbol, const name& ram_payer ){
   		require_auth( ram_payer );

	    check( is_account( owner ), "owner account does not exist" );

	    auto sym_code_raw = symbol.code().raw();
	    stats statstable( get_self(), sym_code_raw );
	    const auto& st = statstable.get( sym_code_raw, "symbol does not exist" );
	    check( st.supply.symbol == symbol, "symbol precision mismatch" );

	    accounts acnts( get_self(), owner.value );
	    auto it = acnts.find( sym_code_raw );
	    if( it == acnts.end() ) {
	        acnts.emplace( ram_payer, [&]( auto& a ){
	        	a.balance = asset{0, symbol};
	        });
	    }
	}

	 [[eosio::action]]
	void close( const name& owner, const symbol& symbol ){
  		require_auth( owner );
	   	accounts acnts( get_self(), owner.value );
	   	auto it = acnts.find( symbol.code().raw() );
	   	check( it != acnts.end(), "Balance row already deleted or never existed. Action won't have any effect." );
	   	check( it->balance.amount == 0, "Cannot close because the balance is not zero." );
	   	acnts.erase( it );
	}

	static asset get_supply( const name& token_contract_account, const symbol_code& sym_code ){
        stats statstable( token_contract_account, sym_code.raw() );
        const auto& st = statstable.get( sym_code.raw() );
        return st.supply;
    }

    static asset get_balance( const name& token_contract_account, const name& owner, const symbol_code& sym_code ){
        accounts accountstable( token_contract_account, owner.value );
        const auto& ac = accountstable.get( sym_code.raw() );
        return ac.balance;
    }

private:
    struct [[eosio::table]] account {
    	asset    balance;

        uint64_t primary_key()const { return balance.symbol.code().raw(); }
    };

    struct [[eosio::table]] currency_stats {
        asset    supply;
        asset    max_supply;
        name     issuer;

        uint64_t primary_key()const { return supply.symbol.code().raw(); }
    };

    typedef eosio::multi_index< "accounts"_n, account > accounts;
    typedef eosio::multi_index< "stat"_n, currency_stats > stats;

    void sub_balance( const name& owner, const asset& value ){
	    accounts from_acnts( get_self(), owner.value );

	    const auto& from = from_acnts.get( value.symbol.code().raw(), "no balance object found" );
	    check( from.balance.amount >= value.amount, "overdrawn balance" );

	    from_acnts.modify( from, owner, [&]( auto& a ) {
	         a.balance -= value;
	      });
	}
	void add_balance( const name& owner, const asset& value, const name& ram_payer ){
	    accounts to_acnts( get_self(), owner.value );
	    auto to = to_acnts.find( value.symbol.code().raw() );
	    if( to == to_acnts.end() ) {
	       to_acnts.emplace( ram_payer, [&]( auto& a ){
	           a.balance = value;
	       });
	    } else {
	       to_acnts.modify( to, same_payer, [&]( auto& a ) {
	           a.balance += value;
	       });
	    }
	}
};
