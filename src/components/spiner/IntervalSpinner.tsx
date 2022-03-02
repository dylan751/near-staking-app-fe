import React, {useEffect, useState} from "react";
import {Progress} from "antd";

const IntervalSpinner = (props: { onProgressSuccess: Function }) => {
    const [refreshPercent, setRefreshPercent] = useState(0);

    useEffect(() => {
        // handle fresh pool and account
        if (refreshPercent == 100) {
            setRefreshPercent(0);
            props.onProgressSuccess();
        }
    }, [refreshPercent])

    useEffect(() => {
        const intervalPercent = setInterval(() => {
            if (refreshPercent != 100) {
                setRefreshPercent(refreshPercent => refreshPercent + 1);
            }
        }, 100);

        return () => clearInterval(intervalPercent);
    }, [])

    return (
      <Progress width={20} showInfo={false} strokeWidth={18} type="circle" percent={refreshPercent} />
    )
}

export {
    IntervalSpinner
}