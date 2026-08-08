package com.kuklabs.kuktrip.data.trips

import com.google.gson.annotations.SerializedName

data class BudgetItem(
    val id: Int,
    @SerializedName("trip_id") val tripId: Int,
    val category: String = "Other",
    val name: String,
    @SerializedName("total_price") val totalPrice: Double = 0.0,
    val persons: Int? = null,
    val days: Int? = null,
    val note: String? = null,
    @SerializedName("expense_date") val expenseDate: String? = null,
    @SerializedName("reservation_id") val reservationId: Int? = null,
)

data class BudgetEnvelope(val items: List<BudgetItem> = emptyList())

data class CreateBudgetItemBody(
    val name: String,
    val category: String = "Other",
    @SerializedName("total_price") val totalPrice: Double = 0.0,
    val persons: Int? = null,
    val days: Int? = null,
    val note: String? = null,
    @SerializedName("expense_date") val expenseDate: String? = null,
)

data class BudgetItemEnvelope(val item: BudgetItem)
